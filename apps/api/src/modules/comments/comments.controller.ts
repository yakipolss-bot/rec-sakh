import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto, CreateCommentSchema } from './dto/create-comment.dto.js';
import { UpdateCommentDto, UpdateCommentSchema } from './dto/update-comment.dto.js';
import { CommentsQueryDto } from './dto/comments-query.dto.js';
import { BanUserDto, BanUserSchema } from './dto/ban-user.dto.js';
import { BulkModerateDto, BulkModerateSchema } from './dto/bulk-moderate.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Список комментариев' })
  async findAll(@Query() query: CommentsQueryDto) {
    return this.commentsService.findAll(query);
  }

  @Get('moderation/queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Очередь модерации комментариев' })
  async getModerationQueue() {
    return this.commentsService.getModerationQueue();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статистика комментариев' })
  async getStats() {
    return this.commentsService.getStats();
  }

  @Post('ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @UsePipes(new ZodValidationPipe(BanUserSchema))
  @ApiOperation({ summary: 'Заблокировать пользователя (комментарии)' })
  async banUser(@Body() dto: BanUserDto, @CurrentUser('id') adminId: string) {
    return this.commentsService.banUser(dto, adminId);
  }

  @Delete('ban/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Разблокировать пользователя' })
  async unbanUser(@Param('userId') userId: string) {
    return this.commentsService.unbanUser(userId);
  }

  @Get('blacklist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список чёрных слов' })
  async getBlacklist() {
    return this.commentsService.getBlacklist();
  }

  @Get(':id/replies')
  @Public()
  @ApiOperation({ summary: 'Ответы на комментарий' })
  async getReplies(@Param('id') id: string) {
    return this.commentsService.getReplies(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание комментария' })
  @UsePipes(new ZodValidationPipe(CreateCommentSchema))
  async create(
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.create(dto, userId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Редактирование комментария (только автор)' })
  @UsePipes(new ZodValidationPipe(UpdateCommentSchema))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление комментария (автор/editor+)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.commentsService.remove(id, user.id, user.role);
  }

  @Post(':id/vote')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Голосование за комментарий (1/-1)' })
  @ApiQuery({ name: 'vote', required: true, type: Number })
  async vote(
    @Param('id') id: string,
    @Query('vote') vote: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.vote(id, userId, parseInt(vote, 10));
  }

  @Post(':id/report')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Пожаловаться на комментарий' })
  @ApiQuery({ name: 'reason', required: true, type: String })
  @ApiQuery({ name: 'description', required: false, type: String })
  async report(
    @Param('id') id: string,
    @Query('reason') reason: string,
    @CurrentUser('id') userId: string,
    @Query('description') description?: string,
  ) {
    return this.commentsService.report(id, userId, reason, description);
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Модерация: одобрить/отклонить' })
  async moderate(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.commentsService.moderate(id, status);
  }

  @Post('bulk-moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @UsePipes(new ZodValidationPipe(BulkModerateSchema))
  @ApiOperation({ summary: 'Массовая модерация комментариев' })
  async bulkModerate(@Body() dto: BulkModerateDto) {
    return this.commentsService.bulkModerate(dto);
  }

  @Patch(':id/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'chief_editor', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Закрепить/открепить комментарий' })
  async pin(@Param('id') id: string) {
    return this.commentsService.pin(id);
  }

  @Post('blacklist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить слово в чёрный список' })
  async addBlacklistWord(
    @Body('word') word: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.addBlacklistWord(word, userId);
  }

  @Delete('blacklist/:word')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('moderator', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить слово из чёрного списка' })
  async removeBlacklistWord(@Param('word') word: string) {
    await this.commentsService.removeBlacklistWord(word);
  }
}
