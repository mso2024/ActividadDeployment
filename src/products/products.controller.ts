import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Request,
    ForbiddenException,
    Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { Public } from '../users/decorators/public.decorator';
import { CheckPolicies } from '../users/decorators/check-policies.decorator';
import { AbilityFactory, Action } from '../abilities/ability.factory';
import { CategoryService } from '../category/category.service';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly categoryService: CategoryService,
        private abilityFactory: AbilityFactory,
    ) { }

    @Public()
    @Get()
    async findAll(@Query('categoryId') categoryId?: string) {
        if (categoryId) {
            return this.productsService.findByCategory(categoryId);
        }
        return this.productsService.findAll();
    }

    @Public()
    @Get('category/:categoryId')
    findByCategory(@Param('categoryId') categoryId: string) {
        return this.productsService.findByCategory(categoryId);
    }

    @Public()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findById(id);
    }

    @CheckPolicies({ action: Action.Create, subject: 'Product' })
    @Post()
    async create(@Body() createProductDto: CreateProductDto, @Request() req) {
        // The service will validate the category existence
        return this.productsService.create(createProductDto, req.user.id);
    }

    @CheckPolicies({ action: Action.Update, subject: 'Product', checkData: true })
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
        @Request() req,
    ) {
        const product = await this.productsService.findById(id);
        const ability = this.abilityFactory.defineAbilitiesFor(req.user);

        // Manual check for entity-specific permissions
        if (!this.abilityFactory.can(ability, Action.Update, 'Product', product)) {
            throw new ForbiddenException('You can only update your own products');
        }

        // The service will validate the category existence if categoryId is provided
        return this.productsService.update(id, updateProductDto);
    }

    @CheckPolicies({ action: Action.Delete, subject: 'Product', checkData: true })
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req) {
        const product = await this.productsService.findById(id);
        const ability = this.abilityFactory.defineAbilitiesFor(req.user);

        // Manual check for entity-specific permissions
        if (!this.abilityFactory.can(ability, Action.Delete, 'Product', product)) {
            throw new ForbiddenException('You can only delete your own products');
        }

        return this.productsService.delete(id);
    }

    // Admin-only route example
    @CheckPolicies({ action: Action.Manage, subject: 'Product' })
    @Get('admin/all')
    findAllAdmin() {
        return this.productsService.findAll();
    }
}