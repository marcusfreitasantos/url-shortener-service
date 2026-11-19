import {
  ArgumentsHost,
  Catch,
  HttpException,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  isConnectionError,
  isDatabaseError,
  isUniqueViolation,
} from '../errors/database-error.js';

@Catch()
export class DatabaseExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    if (!(exception instanceof HttpException) && isDatabaseError(exception)) {
      this.logger.error(exception);
      super.catch(toPublicException(exception), host);
      return;
    }

    super.catch(exception, host);
  }
}

function toPublicException(error: unknown): HttpException {
  if (isUniqueViolation(error)) {
    return new ServiceUnavailableException(
      'Não foi possível gerar o link curto.',
    );
  }

  if (isConnectionError(error)) {
    return new ServiceUnavailableException(
      'Serviço temporariamente indisponível.',
    );
  }

  return new InternalServerErrorException('Erro interno do servidor.');
}
