import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Query {
  @Prop({ required: true }) question: string;
  @Prop() finalAnswer: string;
  @Prop({ type: Object }) trace: Record<string, any>;
}

export type QueryDocument = Query & Document;
export const QuerySchema = SchemaFactory.createForClass(Query);
