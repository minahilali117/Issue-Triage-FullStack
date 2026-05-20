import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IssuePriority, IssueStatus } from '../issues.types';

export class UpdateIssueDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(5000)
  description?: string;

  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus;

  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

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
