import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatGroq } from '@langchain/groq';
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Product, ProductDocument } from './schemas/product.schema';

// ── LangGraph state for AI intent search ─────────────────────────────────────
const SearchState = Annotation.Root({
  userQuery: Annotation<string>({
    reducer: (_, y) => y,
    default: () => '',
  }),
  keywords: Annotation<string[]>({
    reducer: (_, y) => y,
    default: () => [],
  }),
  categories: Annotation<string[]>({
    reducer: (_, y) => y,
    default: () => [],
  }),
});

@Injectable()
export class ProductsService {
  private llm: ChatGroq;
  private searchGraph: ReturnType<typeof this.buildSearchGraph>;

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      maxTokens: 200,
    });
    this.searchGraph = this.buildSearchGraph();
  }

  // ── Node: extract keywords/categories from health concern via LLM ────────
  private async nodeExtractIntent(state: typeof SearchState.State) {
    const response = await this.llm.invoke([
      new SystemMessage(
        `You are a healthcare product search assistant.
Extract relevant product keywords, categories, or ingredients from the user's health concern.
Return ONLY a JSON object like: {"keywords": ["calcium", "vitamin D"], "categories": ["bone health", "supplements"]}
No explanation, just JSON.`,
      ),
      new HumanMessage(state.userQuery),
    ]);

    try {
      const raw =
        typeof response.content === 'string' ? response.content : '{}';
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        keywords: parsed.keywords || [],
        categories: parsed.categories || [],
      };
    } catch {
      return { keywords: [], categories: [] };
    }
  }

  // ── Build the LangGraph search graph ─────────────────────────────────────
  private buildSearchGraph() {
    const workflow = new StateGraph(SearchState)
      .addNode('extractIntent', this.nodeExtractIntent.bind(this))
      .addEdge(START, 'extractIntent')
      .addEdge('extractIntent', END);

    return workflow.compile();
  }

  // ── Public: find all / keyword search / AI intent search ─────────────────
  async findAll(query?: string, aiSearch?: boolean) {
    if (!query) {
      return this.productModel.find().limit(50).lean();
    }

    if (aiSearch) {
      return this.aiIntentSearch(query);
    }

    return this.productModel
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } },
          { brand: { $regex: query, $options: 'i' } },
        ],
      })
      .limit(20)
      .lean();
  }

  private async aiIntentSearch(userQuery: string) {
    try {
      const result = await this.searchGraph.invoke({ userQuery });
      const terms = [...result.keywords, ...result.categories];

      if (!terms.length) return this.productModel.find().limit(10).lean();

      const regexOr = terms.flatMap((term) => [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { tags: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
      ]);

      return this.productModel.find({ $or: regexOr }).limit(10).lean();
    } catch (error) {
      console.error('AI search graph error:', error?.message || error);
      return this.productModel.find().limit(10).lean();
    }
  }

  // ── Seed helpers ──────────────────────────────────────────────────────────
  async seed() {
    const count = await this.productModel.countDocuments();
    if (count > 0) return { message: 'Already seeded' };
    return this.reseed();
  }

  async reseed() {
    await this.productModel.deleteMany({});
    const products = [
      {
        name: 'Vitamin C 1000mg',
        description: 'High-potency Vitamin C for immune support and antioxidant protection.',
        category: 'Vitamins',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop&auto=format',
        tags: ['vitamin c', 'immune', 'antioxidant', 'ascorbic acid'],
        brand: 'NutriHealth',
        rating: 4.5,
      },
      {
        name: 'Calcium + Vitamin D3',
        description: 'Essential calcium with D3 for strong bones and teeth. Ideal for bone health.',
        category: 'Bone Health',
        price: 15.49,
        image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&h=200&fit=crop&auto=format',
        tags: ['calcium', 'vitamin d', 'bone health', 'teeth', 'osteoporosis'],
        brand: 'BoneStrong',
        rating: 4.7,
      },
      {
        name: 'Omega-3 Fish Oil',
        description: 'Premium fish oil for heart health, brain function, and joint support.',
        category: 'Heart Health',
        price: 18.99,
        image: 'https://images.unsplash.com/photo-1626716493137-b67fe9501e76?w=300&h=200&fit=crop&auto=format',
        tags: ['omega 3', 'fish oil', 'heart', 'brain', 'joints', 'EPA', 'DHA'],
        brand: 'OceanPure',
        rating: 4.6,
      },
      {
        name: 'Biotin 10000mcg',
        description: 'High-strength biotin for hair growth, nail strength, and skin health.',
        category: 'Hair & Skin',
        price: 11.99,
        image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&h=200&fit=crop&auto=format',
        tags: ['biotin', 'hair', 'nails', 'skin', 'hair fall', 'hair growth'],
        brand: 'GlowVita',
        rating: 4.4,
      },
      {
        name: 'Multivitamin Daily',
        description: 'Complete daily multivitamin with 23 essential vitamins and minerals.',
        category: 'Multivitamins',
        price: 22.99,
        image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&h=200&fit=crop&auto=format',
        tags: ['multivitamin', 'daily', 'energy', 'immunity', 'complete'],
        brand: 'VitaComplete',
        rating: 4.3,
      },
      {
        name: 'Magnesium Glycinate',
        description: 'Highly absorbable magnesium for sleep, muscle relaxation, and stress relief.',
        category: 'Sleep & Stress',
        price: 16.99,
        image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop&auto=format',
        tags: ['magnesium', 'sleep', 'stress', 'muscle', 'relaxation', 'anxiety'],
        brand: 'CalmMag',
        rating: 4.8,
      },
      {
        name: 'Zinc Immune Support',
        description: 'Zinc supplement to boost immunity, support wound healing and metabolism.',
        category: 'Immunity',
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&h=200&fit=crop&auto=format',
        tags: ['zinc', 'immune', 'immunity', 'wound healing', 'cold'],
        brand: 'ImmuneShield',
        rating: 4.2,
      },
      {
        name: 'Collagen Peptides',
        description: 'Hydrolyzed collagen for skin elasticity, joint health, and anti-aging.',
        category: 'Skin & Joints',
        price: 29.99,
        image: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=300&h=200&fit=crop&auto=format',
        tags: ['collagen', 'skin', 'joints', 'anti-aging', 'elasticity', 'wrinkles'],
        brand: 'YouthGlow',
        rating: 4.6,
      },
      {
        name: 'Probiotic 50 Billion CFU',
        description: 'Multi-strain probiotic for gut health, digestion, and immune balance.',
        category: 'Digestive Health',
        price: 24.99,
        image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=300&h=200&fit=crop&auto=format',
        tags: ['probiotic', 'gut', 'digestion', 'bloating', 'IBS', 'stomach'],
        brand: 'GutGuard',
        rating: 4.5,
      },
      {
        name: 'Iron + Folic Acid',
        description: 'Iron supplement with folic acid for anemia prevention and energy levels.',
        category: 'Blood Health',
        price: 13.49,
        image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=300&h=200&fit=crop&auto=format',
        tags: ['iron', 'folic acid', 'anemia', 'energy', 'fatigue', 'blood'],
        brand: 'IronVita',
        rating: 4.3,
      },
      {
        name: 'Vitamin D3 5000 IU',
        description: 'High-dose Vitamin D3 for bone health, mood support, and immune function.',
        category: 'Vitamins',
        price: 10.99,
        image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300&h=200&fit=crop&auto=format',
        tags: ['vitamin d', 'vitamin d3', 'bone', 'mood', 'immune', 'sunshine vitamin'],
        brand: 'SunVita',
        rating: 4.7,
      },
      {
        name: 'Ashwagandha KSM-66',
        description: 'Adaptogenic herb for stress reduction, energy, and hormonal balance.',
        category: 'Stress & Energy',
        price: 19.99,
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=200&fit=crop&auto=format',
        tags: ['ashwagandha', 'stress', 'anxiety', 'energy', 'adaptogen', 'cortisol'],
        brand: 'HerbalPure',
        rating: 4.6,
      },
    ];
    await this.productModel.insertMany(products);
    return { message: `Seeded ${products.length} products` };
  }
}
