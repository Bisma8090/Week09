import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkflowService } from './workflow.service';
import { ResearchDocument, ResearchDocumentSchema } from '../schemas/document.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ResearchDocument.name, schema: ResearchDocumentSchema }])],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
