import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ResearchDocument, ResearchDocumentSchema } from '../schemas/document.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ResearchDocument.name, schema: ResearchDocumentSchema }])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
