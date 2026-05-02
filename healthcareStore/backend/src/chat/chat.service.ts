import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatGroq } from '@langchain/groq';
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { Product, ProductDocument } from '../products/schemas/product.schema';

// ── LangGraph state definition ───────────────────────────────────────────────
const ChatState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  userMessage: Annotation<string>({
    reducer: (_, y) => y,
    default: () => '',
  }),
  productContext: Annotation<string>({
    reducer: (_, y) => y,
    default: () => '',
  }),
  reply: Annotation<string>({
    reducer: (_, y) => y,
    default: () => '',
  }),
  mentionedProductNames: Annotation<string[]>({
    reducer: (_, y) => y,
    default: () => [],
  }),
});

@Injectable()
export class ChatService {
  private llm: ChatGroq;
  private graph: ReturnType<typeof this.buildGraph>;

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      maxTokens: 500,
    });
    this.graph = this.buildGraph();
  }

  // ── Node 1: fetch all products and build context string ──────────────────
  private async nodeLoadContext(_state: typeof ChatState.State) {
    const products = await this.productModel.find().lean();
    const productContext = products
      .map(
        (p) =>
          `- ${p.name} (${p.category}): ${p.description} | Tags: ${p.tags?.join(', ')}`,
      )
      .join('\n');
    return { productContext };
  }

  // ── Node 2: call LLM with product context + conversation history ─────────
  private async nodeGenerateReply(state: typeof ChatState.State) {
    const systemPrompt = `You are a helpful healthcare product assistant for an online health store.
You help users find the right health supplements and products based on their needs.

Available products in our store:
${state.productContext}

When recommending products:
1. Suggest specific products from the list above
2. Explain briefly WHY each product helps with their concern
3. Keep responses concise and friendly
4. If asked about something unrelated to health products, politely redirect to health topics
5. Format product recommendations clearly`;

    const msgs: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      ...state.messages,
      new HumanMessage(state.userMessage),
    ];

    const response = await this.llm.invoke(msgs);
    const reply =
      typeof response.content === 'string'
        ? response.content
        : 'Sorry, I could not process that.';
    return { reply };
  }

  // ── Node 3: scan reply for product name mentions ─────────────────────────
  private async nodeExtractProducts(state: typeof ChatState.State) {
    const products = await this.productModel.find().lean();
    const mentionedProductNames = products
      .filter((p) => state.reply.toLowerCase().includes(p.name.toLowerCase()))
      .map((p) => p.name);
    return { mentionedProductNames };
  }

  // ── Compile the LangGraph StateGraph ────────────────────────────────────
  private buildGraph() {
    const workflow = new StateGraph(ChatState)
      .addNode('loadContext', this.nodeLoadContext.bind(this))
      .addNode('generateReply', this.nodeGenerateReply.bind(this))
      .addNode('extractProducts', this.nodeExtractProducts.bind(this))
      .addEdge(START, 'loadContext')
      .addEdge('loadContext', 'generateReply')
      .addEdge('generateReply', 'extractProducts')
      .addEdge('extractProducts', END);

    return workflow.compile();
  }

  // ── Public API ───────────────────────────────────────────────────────────
  async chat(message: string, history: { role: string; content: string }[] = []) {
    try {
      const historyMessages: BaseMessage[] = history.map((h) =>
        h.role === 'user'
          ? new HumanMessage(h.content)
          : new AIMessage(h.content),
      );

      const result = await this.graph.invoke({
        userMessage: message,
        messages: historyMessages,
      });

      const mentionedProducts = await this.productModel
        .find({ name: { $in: result.mentionedProductNames } })
        .lean();

      return { reply: result.reply, products: mentionedProducts };
    } catch (error) {
      console.error('Chat graph error:', error?.message || error);
      return {
        reply:
          'I apologize, the AI service is currently unavailable. Please check your Groq API key.',
        products: [],
      };
    }
  }
}
