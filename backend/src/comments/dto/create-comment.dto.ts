import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2000)
  content!: string;

  @Transform(({ value }: TransformFnParams) =>
    Array.isArray(value)
      ? value
          .map((entry) => Number(entry))
          .filter((entry) => Number.isInteger(entry) && entry > 0)
      : undefined,
  )
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsOptional()
  mentionIds?: number[];
}
