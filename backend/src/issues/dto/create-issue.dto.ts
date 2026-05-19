import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
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

  @IsString()
  @IsOptional()
  assignee?: string;
}
