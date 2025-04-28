import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schema/product.schema';
import { CategoryModule } from '../category/category.module';
import { AbilityFactory } from 'src/abilities/ability.factory';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CategoryModule,
  ],
  providers: [ProductsService, AbilityFactory],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
