import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IssuePriority, IssueStatus } from '../issues.types';

export class CreateIssueDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @IsEnum(IssueStatus)
  status!: IssueStatus;

  @IsEnum(IssuePriority)
  priority!: IssuePriority;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category!: string;

  @Transform(({ value }: TransformFnParams) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return parsed;
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  assigneeId?: number | null;
}
