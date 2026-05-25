import { Transform, type TransformFnParams } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @Transform(({ value }: TransformFnParams) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const next = String(value).trim();
    return next.length > 0 ? next : null;
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string | null;
}
