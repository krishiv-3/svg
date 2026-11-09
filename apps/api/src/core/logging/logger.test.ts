import { Writable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { REDACTION_CENSOR, createLogger, withRequestId } from './logger.js';

function capture(): { stream: Writable; lines: () => Record<string, unknown>[] } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  return {
    stream,
    lines: () =>
      chunks
        .join('')
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as Record<string, unknown>),
  };
}

describe('structured logging', () => {
  it('emits one JSON object per line', () => {
    const { stream, lines } = capture();
    const logger = createLogger({ level: 'info', stream });

    logger.info({ requestId: 'req-1' }, 'server started');

    const [line] = lines();
    expect(line).toMatchObject({ level: 'info', msg: 'server started', requestId: 'req-1' });
    expect(typeof line?.time).toBe('string');
  });

  it('redacts credentials at the top level', () => {
    const { stream, lines } = capture();
    const logger = createLogger({ level: 'info', stream });

    logger.info(
      {
        password: 'hunter2',
        token: 'abc123',
        authorization: 'Bearer supersecret',
        cookie: 'session=deadbeef',
        databaseUrl: 'postgresql://user:pass@host/db',
        pan: 'ABCDE1234F',
      },
      'sensitive fields',
    );

    const [line] = lines();
    expect(line?.password).toBe(REDACTION_CENSOR);
    expect(line?.token).toBe(REDACTION_CENSOR);
    expect(line?.authorization).toBe(REDACTION_CENSOR);
    expect(line?.cookie).toBe(REDACTION_CENSOR);
    expect(line?.databaseUrl).toBe(REDACTION_CENSOR);
    expect(line?.pan).toBe(REDACTION_CENSOR);

    const raw = JSON.stringify(line);
    expect(raw).not.toContain('hunter2');
    expect(raw).not.toContain('supersecret');
    expect(raw).not.toContain('ABCDE1234F');
  });

  it('redacts nested fields', () => {
    const { stream, lines } = capture();
    const logger = createLogger({ level: 'info', stream });

    logger.info({ user: { password: 'hunter2', token: 'abc' } }, 'nested');

    const [line] = lines();
    expect((line?.user as Record<string, unknown>).password).toBe(REDACTION_CENSOR);
    expect((line?.user as Record<string, unknown>).token).toBe(REDACTION_CENSOR);
  });

  it('redacts request headers through the pino-http shape', () => {
    const { stream, lines } = capture();
    const logger = createLogger({ level: 'info', stream });

    logger.info(
      {
        req: {
          method: 'POST',
          url: '/auth/login',
          headers: { cookie: 'session=secret', authorization: 'Bearer x' },
        },
      },
      'request',
    );

    const [line] = lines();
    const req = line?.req as { method: string; headers: Record<string, string> };
    expect(req.headers.cookie).toBe(REDACTION_CENSOR);
    expect(req.headers.authorization).toBe(REDACTION_CENSOR);
    expect(req.method).toBe('POST');
  });

  it('serialises errors with a stack but no secrets', () => {
    const { stream, lines } = capture();
    const logger = createLogger({ level: 'error', stream });

    logger.error({ err: new Error('boom') }, 'failed');

    const [line] = lines();
    const err = line?.err as { message: string; type: string; stack: string };
    expect(err.message).toBe('boom');
    expect(err.type).toBe('Error');
    expect(err.stack).toContain('Error: boom');
  });

  it('binds a request id on child loggers', () => {
    const { stream, lines } = capture();
    const root = createLogger({ level: 'info', stream });
    const child = withRequestId(root, 'req-42');

    child.info('child line');

    const [line] = lines();
    expect(line?.requestId).toBe('req-42');
    expect(line?.service).toBe('gaushala-api');
  });

  it('honours the silent level', () => {
    const { stream, lines } = capture();
    const logger = createLogger({ level: 'silent', stream });

    logger.info('should not appear');

    expect(lines()).toHaveLength(0);
  });
});
