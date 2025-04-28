import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps : true })
export class Product {
    @Prop({ required : true })
    name: string;

    @Prop({ required : true })
    description: string; 

    @Prop({ required : true })
    price: number;

    @Prop({required : true })
    isActive: boolean;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    createdBy: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
    categoryId: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);