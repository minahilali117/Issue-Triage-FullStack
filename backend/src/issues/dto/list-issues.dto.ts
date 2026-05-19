import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { IssuePriority, IssueSortBy, IssueStatus, SortOrder } from '../issues.types';

export class ListIssuesDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus;

  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  assignee?: string;

  @Transform(({ value }) => (value === undefined ? undefined : Number.parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Transform(({ value }) => (value === undefined ? undefined : Number.parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @IsIn(['createdAt', 'updatedAt', 'priority'])
  @IsOptional()
  sortBy?: IssueSortBy;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: SortOrder;
}
