import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  Body,
  Param,
} from '@nestjs/common';
import { ShortUrlService } from './short-urls.service.js';

@Controller('api')
export class ShortUrlController {
  constructor(private readonly shortUrlService: ShortUrlService) {}

  @Get('/short-urls/:shortCode')
  getShortUrl(@Param('shortCode') shortCode: string): string {
    return this.shortUrlService.getShortUrl(shortCode);
  }

  @Post('/short-urls')
  createShortUrl(@Body() body: { url?: string }): string {
    if (typeof body?.url !== 'string' || !body.url.trim()) {
      throw new BadRequestException('O campo "url" é obrigatório.');
    }

    return this.shortUrlService.createShortUrl(body.url.trim());
  }
}
