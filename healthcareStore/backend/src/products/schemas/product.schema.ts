import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  category: string;

  @Prop()
  price: number;

  @Prop()
  image: string;

  @Prop([String])
  tags: string[];

  @Prop()
  brand: string;

  @Prop({ default: true })
  inStock: boolean;

  @Prop()
  rating: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Text index for search
ProductSchema.index({ name: 'text', description: 'text', tags: 'text', category: 'text' });
