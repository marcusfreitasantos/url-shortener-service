import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  Body,
  Param,
  HttpCode,
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
  @HttpCode(201)
  createShortUrl(@Body() body: { url?: string }) {
    if (typeof body?.url !== 'string' || !body.url.trim()) {
      throw new BadRequestException('O campo "url" é obrigatório.');
    }

    return this.shortUrlService.createShortUrl(body.url.trim());
  }
}
