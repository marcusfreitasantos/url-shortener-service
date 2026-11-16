import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Redirect,
} from '@nestjs/common';
import { ShortUrlService } from './short-urls.service.js';
import {
  type CreateShortUrl,
  createShortUrlSchema,
  shortCodeSchema,
} from './short-url.schema.js';

@Controller()
export class ShortUrlController {
  constructor(private readonly shortUrlService: ShortUrlService) {}

  @Get(':code')
  @Redirect()
  async getShortUrl(@Param('code', { schema: shortCodeSchema }) code: string) {
    const { originalUrl } = await this.shortUrlService.getShortUrl(code);
    return { url: originalUrl, statusCode: 302 };
  }

  @Post('short-urls')
  @HttpCode(201)
  createShortUrl(@Body({ schema: createShortUrlSchema }) body: CreateShortUrl) {
    return this.shortUrlService.createShortUrl(body.url);
  }
}
