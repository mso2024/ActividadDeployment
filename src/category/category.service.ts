import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schema/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
        constructor(
            @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        ) {}
    
        async findAll(userId?: string): Promise<Category[]> {
            const query = userId ? { createdBy: userId } : {};
            return this.categoryModel.find(query).exec();
        }
    
        async findById(id: string): Promise<Category> {
            const category = await this.categoryModel.findById(id).exec();
            if (!category) {
                throw new NotFoundException(`Category with ID ${id} not found`);
            }
            return category;
        }
    
        async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
            const newCategory = new this.categoryModel({
                ...createCategoryDto,
                createdBy: userId,
            });
            return newCategory.save();
        }
    
        async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
            const updatedCategory = await this.categoryModel
                .findByIdAndUpdate(id, updateCategoryDto, { new: true })
                .exec();
            if (!updatedCategory) {
                throw new NotFoundException(`Category with ID ${id} not found`);
            }
            return updatedCategory;
        }
    
        async delete(id: string): Promise<boolean> {
            const result = await this.categoryModel.findByIdAndDelete(id).exec();
            if (!result) {
                throw new NotFoundException(`Category with ID ${id} not found`);
            }
            return true;
        }
    }
