import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CategoryService } from '../category/category.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        private categoryService: CategoryService,
    ) {}

    async findAll(userId?: string): Promise<Product[]> {
        const query = userId ? { createdBy: userId } : {};
        return this.productModel.find(query).populate('categoryId').exec();
    }

    async findById(id: string): Promise<Product> {
        const product = await this.productModel.findById(id).populate('categoryId').exec();
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }

    async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
        // Validate that the category exists
        try {
            await this.categoryService.findById(createProductDto.categoryId);
        } catch (error) {
            throw new BadRequestException(`Category with ID ${createProductDto.categoryId} not found`);
        }

        const newProduct = new this.productModel({
            ...createProductDto,
            createdBy: userId,
        });
        return newProduct.save();
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
        // If categoryId is provided, validate that it exists
        if (updateProductDto.categoryId) {
            try {
                await this.categoryService.findById(updateProductDto.categoryId);
            } catch (error) {
                throw new BadRequestException(`Category with ID ${updateProductDto.categoryId} not found`);
            }
        }

        const updatedProduct = await this.productModel
            .findByIdAndUpdate(id, updateProductDto, { new: true })
            .exec();
        if (!updatedProduct) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return updatedProduct;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.productModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return true;
    }

    async findByCategory(categoryId: string): Promise<Product[]> {
        // Validate that the category exists
        try {
            await this.categoryService.findById(categoryId);
        } catch (error) {
            throw new BadRequestException(`Category with ID ${categoryId} not found`);
        }
        
        return this.productModel.find({ categoryId }).populate('categoryId').exec();
    }
}
