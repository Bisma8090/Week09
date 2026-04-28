import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ResearchDocument {
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) topic: string;
  @Prop({ required: true }) content: string;
  @Prop({ default: () => new Date().toISOString().split('T')[0] }) createdAt: string;
}

export type ResearchDocumentDocument = ResearchDocument & Document;
export const ResearchDocumentSchema = SchemaFactory.createForClass(ResearchDocument);
