import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AttachmentsService } from './attachments.service';

const uploadPath = join(process.cwd(), 'uploads', 'issue-attachments');
mkdirSync(uploadPath, { recursive: true });
const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
]);

@Controller('issues/:issueId/attachments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.DEVELOPER, Role.VIEWER)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  list(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.attachmentsService.list(issueId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadPath,
        filename: (_req, file, callback) => {
          const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${suffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
          callback(new BadRequestException('Unsupported file type'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  upload(
    @Param('issueId', ParseIntPipe) issueId: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { userId: number },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.attachmentsService.create(issueId, file, user.userId);
  }

  @Get(':attachmentId/download')
  async download(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Res() response: Response,
  ) {
    const attachment = await this.attachmentsService.getForDownload(
      issueId,
      attachmentId,
    );
    return response.download(attachment.filePath, attachment.fileName);
  }

  @Delete(':attachmentId')
  @Roles(Role.ADMIN, Role.DEVELOPER)
  remove(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @CurrentUser() user: { userId: number; role: Role },
  ) {
    return this.attachmentsService.remove(issueId, attachmentId, user);
  }
}
