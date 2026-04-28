import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResearchDocument, ResearchDocumentDocument } from '../schemas/document.schema';

// ── helpers ──────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set(['what','is','are','the','a','an','of','to','in','and','or','for','on','with','how','why','when','should','you','do','does','can','vs','versus','between','difference','use','using','used','it','its','this','that','these','those','be','been','being','have','has','had','will','would','could','should','may','might','about','which','who','where','there','their','they','we','our','your','my','me','him','her','us','them']);

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

function termFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;
  return tf;
}

function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, magA = 0, magB = 0;
  for (const k of keys) {
    const va = a[k] ?? 0, vb = b[k] ?? 0;
    dot += va * vb; magA += va * va; magB += vb * vb;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

/** TextRank-lite: pick top N sentences by average cosine similarity to others */
function summarize(text: string, topN = 3): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  if (sentences.length <= topN) return sentences.join(' ');
  const vecs = sentences.map(s => termFrequency(tokenize(s)));
  const scores = vecs.map((v, i) =>
    vecs.reduce((sum, w, j) => sum + (i !== j ? cosineSimilarity(v, w) : 0), 0)
  );
  return sentences
    .map((s, i) => ({ s, score: scores[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(x => x.s.trim())
    .join(' ');
}

// ── workflow state ────────────────────────────────────────────────────────────

export interface WorkflowState {
  question: string;
  subQuestions: string[];
  retrievedDocs: Array<{ doc: any; subQ: string }>;
  rankedDocs: Array<{ doc: any; score: number; subQ: string }>;
  summaries: Array<{ title: string; summary: string; subQ: string }>;
  contradictions: string[];
  finalAnswer: string;
  trace: {
    steps: Array<{ step: string; detail: any }>;
    docsUsed: string[];
    contradictions: string[];
  };
}

@Injectable()
export class WorkflowService {
  constructor(
    @InjectModel(ResearchDocument.name)
    private docModel: Model<ResearchDocumentDocument>,
  ) {}

  // ── Step 1: Question Splitter ─────────────────────────────────────────────
  private splitQuestion(question: string): string[] {
    const q = question.toLowerCase();
    const subQs: string[] = [];

    // detect comparison pattern
    const vsMatch = q.match(/(.+?)\s+vs\.?\s+(.+)/);
    if (vsMatch) {
      const a = vsMatch[1].trim(), b = vsMatch[2].trim().replace(/[?.]$/, '');
      subQs.push(`What is ${a}?`, `What is ${b}?`, `What are the pros and cons of ${a}?`, `What are the pros and cons of ${b}?`, `When to use ${a} vs ${b}?`);
      return subQs;
    }

    // generic split: extract noun phrases / key terms
    const cleaned = question.replace(/[?!.]/g, '').trim();
    subQs.push(
      `What is ${cleaned}?`,
      `What are the advantages of ${cleaned}?`,
      `What are the disadvantages of ${cleaned}?`,
      `When should you use ${cleaned}?`,
    );
    return subQs;
  }

  // ── Step 2: Document Finder ───────────────────────────────────────────────
  private async findDocuments(subQuestions: string[]): Promise<Array<{ doc: any; subQ: string }>> {
    const allDocs = await this.docModel.find().lean();
    const results: Array<{ doc: any; subQ: string }> = [];

    for (const subQ of subQuestions) {
      const qTokens = tokenize(subQ);
      for (const doc of allDocs) {
        const docTokens = tokenize(doc.title + ' ' + doc.content);
        const overlap = qTokens.filter(t => docTokens.includes(t)).length;
        if (overlap >= 2) results.push({ doc, subQ });
      }
    }
    return results;
  }

  // ── Step 3: Ranker (TF-IDF cosine) ───────────────────────────────────────
  private rankDocuments(
    retrieved: Array<{ doc: any; subQ: string }>,
  ): Array<{ doc: any; score: number; subQ: string }> {
    return retrieved
      .map(({ doc, subQ }) => {
        const qVec = termFrequency(tokenize(subQ));
        const dVec = termFrequency(tokenize(doc.title + ' ' + doc.content));
        return { doc, score: cosineSimilarity(qVec, dVec), subQ };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6); // top 6 across all sub-questions
  }

  // ── Step 4: Summarizer (TextRank-lite) ────────────────────────────────────
  private buildSummaries(
    ranked: Array<{ doc: any; score: number; subQ: string }>,
  ): Array<{ title: string; summary: string; subQ: string }> {
    // deduplicate by doc id
    const seen = new Set<string>();
    return ranked
      .filter(({ doc }) => {
        const id = doc._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map(({ doc, subQ }) => ({
        title: doc.title,
        summary: summarize(doc.content, 3),
        subQ,
      }));
  }

  // ── Step 5: Cross-Checker ─────────────────────────────────────────────────
  private checkContradictions(summaries: Array<{ title: string; summary: string }>): string[] {
    const contradictions: string[] = [];
    const scalePairs = [
      ['sql scales better', 'nosql scales better'],
      ['rest is simpler', 'graphql is simpler'],
      ['monolithic is easier', 'microservices is easier'],
      ['ssr is faster', 'csr is faster'],
      ['websockets use less resources', 'polling uses less resources'],
    ];

    for (let i = 0; i < summaries.length; i++) {
      for (let j = i + 1; j < summaries.length; j++) {
        const a = summaries[i].summary.toLowerCase();
        const b = summaries[j].summary.toLowerCase();
        for (const [claimA, claimB] of scalePairs) {
          if (a.includes(claimA.split(' ')[0]) && b.includes(claimB.split(' ')[0])) {
            const aHas = a.includes(claimA.split(' ')[0]);
            const bHas = b.includes(claimB.split(' ')[0]);
            if (aHas && bHas) {
              contradictions.push(
                `"${summaries[i].title}" and "${summaries[j].title}" may have conflicting claims.`,
              );
            }
          }
        }
        // simple opposite keyword detection
        const opposites = [['better', 'worse'], ['faster', 'slower'], ['simpler', 'complex']];
        for (const [pos, neg] of opposites) {
          const aTokens = tokenize(a), bTokens = tokenize(b);
          if (aTokens.includes(pos) && bTokens.includes(neg)) {
            contradictions.push(
              `Potential contradiction between "${summaries[i].title}" and "${summaries[j].title}" on performance claims.`,
            );
            break;
          }
        }
      }
    }
    return [...new Set(contradictions)];
  }

  // ── Step 6: Final Answer Maker ────────────────────────────────────────────
  private buildFinalAnswer(state: Omit<WorkflowState, 'finalAnswer' | 'trace'>): string {
    const { question, subQuestions, summaries, contradictions } = state;
    const lines: string[] = [];
    lines.push(`## Answer: ${question}\n`);
    lines.push(`### Sub-questions explored:\n${subQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`);
    lines.push(`### Key Findings:\n`);
    for (const s of summaries) {
      lines.push(`**${s.title}** *(related to: ${s.subQ})*\n${s.summary}\n`);
    }
    if (contradictions.length) {
      lines.push(`### ⚠️ Contradictions Detected:\n${contradictions.map(c => `- ${c}`).join('\n')}\n`);
    }
    lines.push(`### Summary:\nBased on ${summaries.length} document(s) retrieved and analyzed, the above findings address your question from multiple angles.`);
    return lines.join('\n');
  }

  // ── Main runner ───────────────────────────────────────────────────────────
  async run(question: string): Promise<WorkflowState> {
    const trace: WorkflowState['trace'] = { steps: [], docsUsed: [], contradictions: [] };

    // Step 1
    const subQuestions = this.splitQuestion(question);
    trace.steps.push({ step: 'Question Splitter', detail: subQuestions });

    // Step 2
    const retrievedDocs = await this.findDocuments(subQuestions);
    trace.steps.push({ step: 'Document Finder', detail: `Found ${retrievedDocs.length} candidate doc-matches` });

    // Step 3
    const rankedDocs = this.rankDocuments(retrievedDocs);
    trace.steps.push({ step: 'Ranker', detail: rankedDocs.map(r => ({ title: r.doc.title, score: +r.score.toFixed(4) })) });

    // Step 4
    const summaries = this.buildSummaries(rankedDocs);

    if (summaries.length === 0) {
      trace.steps.push({ step: 'Summarizer', detail: 'No relevant documents found.' });
      return {
        question, subQuestions, retrievedDocs, rankedDocs, summaries, contradictions: [],
        finalAnswer: '> No relevant documents found in the knowledge base for your question. Please upload related documents first.',
        trace: { ...trace, docsUsed: [], contradictions: [] },
      };
    }

    trace.steps.push({ step: 'Summarizer', detail: summaries.map(s => ({ title: s.title, preview: s.summary.slice(0, 80) + '...' })) });
    trace.docsUsed = summaries.map(s => s.title);

    // Step 5
    const contradictions = this.checkContradictions(summaries);
    trace.steps.push({ step: 'Cross-Checker', detail: contradictions.length ? contradictions : 'No contradictions found' });
    trace.contradictions = contradictions;

    // Step 6
    const finalAnswer = this.buildFinalAnswer({ question, subQuestions, retrievedDocs, rankedDocs, summaries, contradictions });
    trace.steps.push({ step: 'Final Answer Maker', detail: 'Answer compiled successfully' });

    return { question, subQuestions, retrievedDocs, rankedDocs, summaries, contradictions, finalAnswer, trace };
  }
}
