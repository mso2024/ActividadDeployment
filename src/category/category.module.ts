import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { AbilitiesModule } from '../abilities/abilities.module';
import { Category, CategorySchema } from './schema/category.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
        AbilitiesModule,
    ],
    controllers: [CategoryController],
    providers: [CategoryService],
    exports: [CategoryService]
})
export class CategoryModule {}
