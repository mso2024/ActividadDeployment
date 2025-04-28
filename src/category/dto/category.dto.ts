import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsBoolean
} from 'class-validator';

export class CreateCategoryDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    imageUrl?: string;
}

export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    imageUrl?: string;
}