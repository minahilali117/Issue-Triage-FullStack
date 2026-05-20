import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { IssuePriority, IssueStatus } from '../issues.types';

export class CreateIssueDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @IsEnum(IssueStatus)
  status!: IssueStatus;

  @IsEnum(IssuePriority)
  priority!: IssuePriority;

  @IsString()
  @IsNotEmpty()
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
