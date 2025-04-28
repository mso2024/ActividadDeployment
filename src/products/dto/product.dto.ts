import {
    IsNotEmpty,
    IsNumber,
    IsString,
    IsOptional,
    IsBoolean
} from 'class-validator';

export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsNotEmpty()
    @IsString()
    categoryId : string;
}

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsNotEmpty()
    @IsString()
    categoryId ?: string;
}