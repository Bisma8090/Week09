import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { MongoClient, Db, Document } from 'mongodb';

// ── LLM ──────────────────────────────────────────────────────────────────────
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0,
});

// ── MongoDB ───────────────────────────────────────────────────────────────────
let mongoClient: MongoClient | null = null;
let db: Db | null = null;

async function getDb(): Promise<Db> {
  if (db) return db;
  mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
    tls: true,
    tlsAllowInvalidCertificates: true,
  });
  await mongoClient.connect();
  db = mongoClient.db(process.env.DB_NAME || 'CricketAgent');
  return db;
}

// ── State ─────────────────────────────────────────────────────────────────────
const AgentStateAnnotation = Annotation.Root({
  question: Annotation<string>({ reducer: (_, b) => b }),
  is_relevant: Annotation<boolean>({ reducer: (_, b) => b, default: () => false }),
  collection: Annotation<string | null>({ reducer: (_, b) => b, default: () => null }),
  mongo_query: Annotation<Record<string, any> | null>({ reducer: (_, b) => b, default: () => null }),
  raw_results: Annotation<Document[] | null>({ reducer: (_, b) => b, default: () => null }),
  formatted_answer: Annotation<string | null>({ reducer: (_, b) => b, default: () => null }),
  final_response: Annotation<string | null>({ reducer: (_, b) => b, default: () => null }),
  error: Annotation<string | null>({ reducer: (_, b) => b, default: () => null }),
});

type AgentState = typeof AgentStateAnnotation.State;

// ── Node 1: Relevancy Checker ─────────────────────────────────────────────────
async function relevancyChecker(state: AgentState): Promise<Partial<AgentState>> {
  const response = await llm.invoke([
    new SystemMessage(`You are a cricket relevancy checker.
Determine if the user's question is about cricket (players, stats, matches, formats like Test/ODI/T20, teams, records, etc.).
Reply with ONLY a JSON object: {"relevant": true} or {"relevant": false}`),
    new HumanMessage(state.question),
  ]);

  try {
    const result = JSON.parse((response.content as string).trim());
    return { is_relevant: result.relevant === true };
  } catch {
    return { is_relevant: false };
  }
}

// ── Node 2: Query Generator ───────────────────────────────────────────────────
const SCHEMA_INFO = `
MongoDB collections and their fields:

1. match_by_match — individual player performance per match
   Fields: player_id, startdate, match_format (Test/ODI/T20I), opposition, ground,
   match_result, innings, not_out, bat_1, bat_2, runs, ball_faced, fours, sixes,
   strike_rate, ducks, overs, maiden, runs_conceded, wickets, economy,
   bowling_average, bowling_strike_rate, match_number, year, dismissals,
   catches, stumps, catches_as_wicketkeeper, catches_in_field, team, fifties, centuries

2. team_match — team performance per match
   Fields: team_name, opponent, startdate, match_format, ground, match_result,
   margin, toss, batting, runs, wickets, overs_played, runs_avg_per_over

   IMPORTANT field values for team_match:
   - ground: exact short names e.g. "Lords", "Melbourne", "Sharjah", "The Oval", "Sydney"
   - match_result: "won" or "lost" or "draw" or "tied" (all lowercase)
   - toss: "won" or "lost" (all lowercase)
   - batting: "1st" or "2nd" (string)
   - margin: STRING like "6 wickets", "181 runs" — NEVER use $gt/$lt on it directly.
     For margin > N runs use special key "__margin_runs_gt": N
     For margin < N runs use special key "__margin_runs_lt": N

3. year_by_year — player stats aggregated by year
   Fields: player_id, year, matches_played, runs, highest_score, bat_avg,
   centuries, wickets, best_bowling_innings, bowl_avg, five_wicket_hauls,
   catches, stumps, ave_diff, match_format (Test/ODI/T20I)

4. player_info — player profile only (NO stats)
   Fields: Player_id (numeric), Short_name, Full_name, Active, DateofBirth,
   Format, Country, Shirt_Number, Batting_style, Bowling_Style, Picture

Generate a MongoDB query plan as JSON:
{"collection":"...","filter":{},"sort":{},"limit":null,"projection":{}}

Rules:
- player_id is NUMERIC. For player name in match_by_match/year_by_year set player_id to name string, backend resolves it.
- For player_info use Short_name with $regex.
- For format use match_format: "T20I" or "ODI" or "Test"

GROUND MAPPING: Lords, Melbourne, Kolkata, Wankhede

COLLECTION SELECTION:
1. Career/aggregate stats → year_by_year
2. Match-by-match player → match_by_match (limit 20)
3. Player profile → player_info
4. Team/venue/toss/margin → team_match

Return ONLY the JSON.
`;

async function queryGenerator(state: AgentState): Promise<Partial<AgentState>> {
  const response = await llm.invoke([
    new SystemMessage(SCHEMA_INFO),
    new HumanMessage(`Generate MongoDB query for: ${state.question}`),
  ]);

  try {
    const content = (response.content as string).trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const queryPlan = JSON.parse(jsonMatch[0]);
      return {
        collection: queryPlan.collection || 'match_by_match',
        mongo_query: queryPlan,
      };
    }
  } catch {
    // fallback
  }

  return {
    collection: 'match_by_match',
    mongo_query: { collection: 'match_by_match', filter: {}, sort: {}, limit: 10, projection: {} },
  };
}

// ── Node 3: Query Executor ────────────────────────────────────────────────────
function extractPlayerName(filter: Record<string, any>): string | null {
  for (const [key, val] of Object.entries(filter)) {
    if (key === 'player_id') {
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val !== null) {
        if (val.$regex) return val.$regex;
        for (const v of Object.values(val)) {
          if (typeof v === 'string') return v as string;
        }
      }
    }
    if ((key === '$and' || key === '$or') && Array.isArray(val)) {
      for (const sub of val) {
        const found = extractPlayerName(sub);
        if (found) return found;
      }
    }
  }
  return null;
}

function replacePlayerId(filter: Record<string, any>, id: number): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(filter)) {
    if (k === 'player_id') out[k] = id;
    else if ((k === '$and' || k === '$or') && Array.isArray(v))
      out[k] = v.map((s: any) => (typeof s === 'object' ? replacePlayerId(s, id) : s));
    else out[k] = v;
  }
  return out;
}

async function sanitizeFilter(filter: Record<string, any>, col: string, database: Db): Promise<Record<string, any>> {
  if (!['match_by_match', 'year_by_year'].includes(col)) return filter;
  const name = extractPlayerName(filter);
  if (!name) return filter;
  const player = await database
    .collection('player_info')
    .findOne({ Short_name: { $regex: name, $options: 'i' } }, { projection: { Player_id: 1, _id: 0 } });
  if (player) return replacePlayerId(filter, player['Player_id'] as number);
  return filter;
}

function extractMarginKeys(filter: Record<string, any>): [Record<string, any>, number | null, number | null] {
  const cleaned: Record<string, any> = {};
  let gt: number | null = null;
  let lt: number | null = null;
  for (const [k, v] of Object.entries(filter)) {
    if (k === '__margin_runs_gt') gt = v as number;
    else if (k === '__margin_runs_lt') lt = v as number;
    else cleaned[k] = v;
  }
  return [cleaned, gt, lt];
}

function filterByMargin(results: Document[], gt: number | null, lt: number | null): Document[] {
  return results.filter((r) => {
    const m = String((r as any).margin || '').match(/^(\d+)\s+runs?/i);
    if (!m) return false;
    const val = parseInt(m[1], 10);
    if (gt !== null && val <= gt) return false;
    if (lt !== null && val >= lt) return false;
    return true;
  });
}

async function queryExecutor(state: AgentState): Promise<Partial<AgentState>> {
  try {
    const database = await getDb();
    const plan = state.mongo_query!;
    const colName = state.collection!;
    const coll = database.collection(colName);

    let filter: Record<string, any> = plan.filter || {};
    const sort: Record<string, any> = plan.sort || {};
    let limit: number = plan.limit || 0;
    const proj: Record<string, any> = plan.projection || {};

    const [cleanFilter, marginGt, marginLt] = extractMarginKeys(filter);
    filter = await sanitizeFilter(cleanFilter, colName, database);

    if (['match_by_match', 'year_by_year'].includes(colName)) {
      if ('player_id' in filter && typeof filter['player_id'] !== 'number') delete filter['player_id'];
    }

    let cursor = coll.find(filter, { projection: { _id: 0, ...proj } });

    if (Object.keys(sort).length > 0) {
      cursor = cursor.sort(sort);
      if (limit <= 0) limit = 20;
    }
    if (limit > 0) cursor = cursor.limit(limit);

    let results: Document[] = await cursor.toArray();

    if (marginGt !== null || marginLt !== null) results = filterByMargin(results, marginGt, marginLt);

    // Enrich player names
    if (results.length > 0 && ['match_by_match', 'year_by_year'].includes(colName)) {
      const ids = [...new Set(results.map((r) => (r as any).player_id).filter(Boolean))];
      if (ids.length > 0) {
        const players = await database
          .collection('player_info')
          .find({ Player_id: { $in: ids } }, { projection: { Player_id: 1, Short_name: 1, _id: 0 } })
          .toArray();
        const nameMap: Record<number, string> = {};
        for (const p of players) nameMap[p['Player_id'] as number] = (p['Short_name'] as string) || 'Unknown';
        for (const r of results) {
          const rec = r as any;
          if (rec.player_id) rec.player_name = nameMap[rec.player_id] || 'Unknown';
        }
      }
    }

    return { raw_results: results };
  } catch (e: any) {
    return { raw_results: [], error: String(e.message) };
  }
}

// ── Node 4: Answer Formatter ──────────────────────────────────────────────────
async function answerFormatter(state: AgentState): Promise<Partial<AgentState>> {
  const results = state.raw_results || [];
  const question = state.question.toLowerCase();
  const col = state.collection || '';

  if (results.length === 0) return { formatted_answer: 'No data found for your query.' };

  const statsKw = ['runs', 'wickets', 'average', 'centuries', 'fifties', 'strike rate', 'economy', 'stats', 'score'];
  if (col === 'player_info' && statsKw.some((kw) => question.includes(kw))) {
    return { formatted_answer: "Sorry, I could not find the stats for your query. Please try rephrasing." };
  }

  // Most wins aggregation
  const winsKw = ['most wins', 'most matches won', 'who won most', 'most victories', 'won the most'];
  if (col === 'team_match' && winsKw.some((kw) => question.includes(kw))) {
    const counts: Record<string, number> = {};
    for (const r of results) {
      const rec = r as any;
      if (rec.match_result === 'won') counts[rec.team_name || 'Unknown'] = (counts[rec.team_name || 'Unknown'] || 0) + 1;
    }
    if (Object.keys(counts).length === 0)
      for (const r of results) {
        const t = (r as any).team_name || 'Unknown';
        counts[t] = (counts[t] || 0) + 1;
      }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [top, cnt] = sorted[0];
    const rows = sorted.map(([t, c]) => `| ${t} | ${c} |`).join('\n');
    return { formatted_answer: `${top} has the most wins with ${cnt} victories.\n\n| Team | Wins |\n| --- | --- |\n${rows}` };
  }

  // Count questions
  const countKw = ['how many times', 'how many matches', 'count of', 'number of matches', 'number of times'];
  if (col === 'team_match' && countKw.some((kw) => question.includes(kw))) {
    return { formatted_answer: `There are **${results.length}** matches matching your query.` };
  }

  // Single result → LLM sentence
  if (results.length === 1) {
    const res = await llm.invoke([
      new SystemMessage('Convert this cricket data into a natural, human-readable sentence. Be concise.'),
      new HumanMessage(`Question: ${state.question}\nData: ${JSON.stringify(results[0])}`),
    ]);
    return { formatted_answer: (res.content as string).trim() };
  }

  // Multiple → markdown table
  const first = results[0] as Record<string, any>;
  let keys = Object.keys(first).filter((k) => k !== '_id');
  if (keys.includes('player_id') && keys.includes('player_name')) {
    keys = keys.filter((k) => k !== 'player_name');
    keys.splice(keys.indexOf('player_id') + 1, 0, 'player_name');
  }

  const header = keys.map((k) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(' | ');
  const sep = keys.map(() => '---').join(' | ');
  const rows = results
    .map((r) => {
      const rec = r as Record<string, any>;
      return `| ${keys.map((k) => (rec[k] != null ? String(rec[k]) : '-')).join(' | ')} |`;
    })
    .join('\n');

  return { formatted_answer: `| ${header} |\n| ${sep} |\n${rows}` };
}

// ── Node 5: Final Response ────────────────────────────────────────────────────
async function formatResponse(state: AgentState): Promise<Partial<AgentState>> {
  if (!state.is_relevant) return { final_response: 'Sorry, I can only answer cricket-related questions.' };
  if (state.error) return { final_response: `An error occurred: ${state.error}` };
  return { final_response: state.formatted_answer || 'No answer available.' };
}

// ── Build Graph ───────────────────────────────────────────────────────────────
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode('relevancy_checker', relevancyChecker)
  .addNode('query_generator', queryGenerator)
  .addNode('query_executor', queryExecutor)
  .addNode('answer_formatter', answerFormatter)
  .addNode('format_response', formatResponse)
  .addEdge('__start__', 'relevancy_checker')
  .addConditionalEdges('relevancy_checker', (s: AgentState) => (s.is_relevant ? 'query_generator' : 'format_response'))
  .addEdge('query_generator', 'query_executor')
  .addEdge('query_executor', 'answer_formatter')
  .addEdge('answer_formatter', 'format_response')
  .addEdge('format_response', END)
  .compile();

export async function ask(question: string): Promise<string> {
  const result = await workflow.invoke({ question });
  return (result.final_response as string) || 'No answer available.';
}
