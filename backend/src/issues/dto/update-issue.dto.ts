import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { IssuePriority, IssueStatus } from '../issues.types';

export class UpdateIssueDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  description?: string;

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
}
