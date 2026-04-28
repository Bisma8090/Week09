import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResearchDocument, ResearchDocumentDocument } from '../schemas/document.schema';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(ResearchDocument.name)
    private docModel: Model<ResearchDocumentDocument>,
  ) {}

  async create(data: Partial<ResearchDocument>) {
    return this.docModel.create(data);
  }

  async findAll() {
    return this.docModel.find().lean();
  }
}
