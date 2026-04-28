import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Query, QueryDocument } from '../schemas/query.schema';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class QueriesService {
  constructor(
    @InjectModel(Query.name) private queryModel: Model<QueryDocument>,
    private readonly workflow: WorkflowService,
  ) {}

  async ask(question: string) {
    const result = await this.workflow.run(question);
    const saved = await this.queryModel.create({
      question,
      finalAnswer: result.finalAnswer,
      trace: result.trace,
    });
    return {
      id: saved._id,
      question,
      finalAnswer: result.finalAnswer,
      trace: result.trace,
    };
  }

  async getTrace(id: string) {
    const q = await this.queryModel.findById(id).lean();
    if (!q) throw new NotFoundException('Query not found');
    return q;
  }
}
