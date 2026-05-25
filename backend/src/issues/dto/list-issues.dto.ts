import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IssuePriority, IssueStatus } from '../issues.types';
import type { IssueSortBy, SortOrder } from '../issues.types';

export class ListIssuesDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  search?: string;

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

  @Transform(
    ({ value }: TransformFnParams) => value === true || value === 'true',
  )
  @IsOptional()
  my?: boolean;

  @Transform(
    ({ value }: TransformFnParams) => value === true || value === 'true',
  )
  @IsOptional()
  unassigned?: boolean;

  @Transform(({ value }: TransformFnParams) =>
    value === undefined ? undefined : Number.parseInt(String(value), 10),
  )
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Transform(({ value }: TransformFnParams) =>
    value === undefined ? undefined : Number.parseInt(String(value), 10),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @IsIn(['createdAt', 'updatedAt', 'priority', 'assignee'])
  @IsOptional()
  sortBy?: IssueSortBy;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: SortOrder;
}
