import {
  ArgumentsHost,
  HttpServer,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseExceptionFilter } from './database-exception.filter.js';

describe('DatabaseExceptionFilter', () => {
  const response = {};
  const httpServer = {
    isHeadersSent: vi.fn().mockReturnValue(false),
    reply: vi.fn(),
    end: vi.fn(),
  };
  const host = {
    getArgByIndex: (index: number) => (index === 1 ? response : {}),
  } as ArgumentsHost;

  let filter: DatabaseExceptionFilter;
  let loggerError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    httpServer.isHeadersSent.mockReturnValue(false);
    httpServer.reply.mockReset();
    httpServer.end.mockReset();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    filter = new DatabaseExceptionFilter(httpServer as unknown as HttpServer);
    loggerError = vi
      .spyOn(filter['logger'], 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes http exceptions through unchanged', () => {
    filter.catch(new NotFoundException('Link não encontrado.'), host);

    expect(httpServer.reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: 404,
        message: 'Link não encontrado.',
      }),
      404,
    );
  });

  it('hides unique constraint details from the client', () => {
    const exception = Object.assign(new Error('duplicate key'), {
      code: '23505',
      constraint: 'short_urls_code_key',
      detail: 'Key (code)=(abcdefghij12) already exists.',
    });

    filter.catch(exception, host);

    expect(httpServer.reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: 503,
        message: 'Não foi possível gerar o link curto.',
      }),
      503,
    );
    expect(JSON.stringify(httpServer.reply.mock.calls)).not.toContain(
      'short_urls_code_key',
    );
    expect(loggerError).toHaveBeenCalledWith(exception);
  });

  it('hides connection failures from the client', () => {
    const exception = Object.assign(new Error('connect ECONNREFUSED'), {
      code: 'ECONNREFUSED',
      detail: 'password=postgres',
    });

    filter.catch(exception, host);

    expect(httpServer.reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: 503,
        message: 'Serviço temporariamente indisponível.',
      }),
      503,
    );
    expect(JSON.stringify(httpServer.reply.mock.calls)).not.toContain(
      'password',
    );
  });

  it('maps other database errors to a generic server error', () => {
    const exception = Object.assign(new Error('null value'), {
      code: '23502',
      detail: 'Failing row contains secret',
    });

    filter.catch(exception, host);

    expect(httpServer.reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: 500,
        message: 'Erro interno do servidor.',
      }),
      500,
    );
    expect(JSON.stringify(httpServer.reply.mock.calls)).not.toContain('secret');
  });

  it('leaves non-database errors to the base filter', () => {
    filter.catch(new Error('unexpected'), host);

    expect(httpServer.reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
      500,
    );
  });
});
