import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  Redirect,
} from '@nestjs/common';
import { ShortUrlService } from './short-urls.service.js';

@Controller()
export class ShortUrlController {
  constructor(private readonly shortUrlService: ShortUrlService) {}

  @Get('/:code')
  @Redirect()
  async getShortUrl(@Param('code') code: string) {
    const { originalUrl } = await this.shortUrlService.getShortUrl(code);
    return { url: originalUrl, statusCode: 302 };
  }

  @Post('/api/short-urls')
  @HttpCode(201)
  createShortUrl(@Body() body: { url?: string }) {
    if (typeof body?.url !== 'string' || !body.url.trim()) {
      throw new BadRequestException('O campo "url" é obrigatório.');
    }

    return this.shortUrlService.createShortUrl(body.url.trim());
  }
}
