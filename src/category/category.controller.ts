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
    UseInterceptors,
    UploadedFile,
    Logger,
    ParseFilePipe,
    FileTypeValidator,
    MaxFileSizeValidator,
    Optional,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Public } from '../users/decorators/public.decorator';
import { CheckPolicies } from '../users/decorators/check-policies.decorator';
import { AbilityFactory, Action } from '../abilities/ability.factory';


@Controller('categories')
export class CategoryController {
    private readonly logger = new Logger(CategoryController.name);
    
    constructor(
        private readonly categoryService: CategoryService,
        private abilityFactory: AbilityFactory,
    ) { }

    @Public()
    @Get()
    findAll() {
        return this.categoryService.findAll();
    }

    @Public()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoryService.findById(id);
    }

    @CheckPolicies({ action: Action.Create, subject: 'Category' })
    @Post()
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads/images',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    return cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    create(
        @Body() createCategoryDto: CreateCategoryDto, 
        @UploadedFile() file: Express.Multer.File,
        @Request() req
    ) {
        this.logger.debug(`Creating category with user: ${JSON.stringify({
            id: req.user?.id,
            role: req.user?.role
        })}`);
        
        if (file) {
            this.logger.debug(`File uploaded: ${file.filename}`);
            createCategoryDto.imageUrl = `uploads/images/${file.filename}`;
        }
        
        return this.categoryService.create(createCategoryDto, req.user.id);
    }

    @CheckPolicies({ action: Action.Update, subject: 'Category', checkData: true })
    @Put(':id')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads/images',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    return cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        const category = await this.categoryService.findById(id);
        const ability = this.abilityFactory.defineAbilitiesFor(req.user);

        // Manual check for entity-specific permissions
        if (!this.abilityFactory.can(ability, Action.Update, 'Category', category)) {
            throw new ForbiddenException('You can only update your own categories');
        }

        if (file) {
            updateCategoryDto.imageUrl = `uploads/images/${file.filename}`;
        }

        return this.categoryService.update(id, updateCategoryDto);
    }

    @CheckPolicies({ action: Action.Delete, subject: 'Category', checkData: true })
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req) {
        const product = await this.categoryService.findById(id);
        const ability = this.abilityFactory.defineAbilitiesFor(req.user);

        // Manual check for entity-specific permissions
        if (!this.abilityFactory.can(ability, Action.Delete, 'Category', product)) {
            throw new ForbiddenException('You can only delete your own categories');
        }

        return this.categoryService.delete(id);
    }

    // Admin-only route example
    @CheckPolicies({ action: Action.Manage, subject: 'Category' })
    @Get('admin/all')
    findAllAdmin() {
        return this.categoryService.findAll();
    }
}