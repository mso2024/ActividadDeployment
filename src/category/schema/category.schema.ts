import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps : true })
export class Category {
    @Prop({ required : true })
    name: string;

    @Prop({ required : true })
    description: string; 

    @Prop({required : true })
    isActive: boolean;
    
    @Prop()
    imageUrl: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    createdBy: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);