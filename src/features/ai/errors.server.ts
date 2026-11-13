import 'server-only';

import { CHAT_COPY } from '@/constants/chat.constant';

export class ChatServerError extends Error {
  readonly code: 'RATE_LIMITED' | 'TIMEOUT' | 'UPSTREAM_ERROR';
  readonly statusCode: 429 | 503 | 504;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    code: 'RATE_LIMITED' | 'TIMEOUT' | 'UPSTREAM_ERROR',
    statusCode: 429 | 503 | 504,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ChatServerError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ChatRateLimitError extends ChatServerError {
  constructor(retryAfterSeconds: number) {
    super(CHAT_COPY.RATE_LIMIT_MESSAGE, 'RATE_LIMITED', 429, retryAfterSeconds);
    this.name = 'ChatRateLimitError';
  }
}

export class ChatTimeoutError extends ChatServerError {
  constructor(message: string = CHAT_COPY.TIMEOUT_MESSAGE) {
    super(message, 'TIMEOUT', 504);
    this.name = 'ChatTimeoutError';
  }
}

export class ChatUpstreamError extends ChatServerError {
  constructor(message: string = CHAT_COPY.OUTAGE_MESSAGE) {
    super(message, 'UPSTREAM_ERROR', 503);
    this.name = 'ChatUpstreamError';
  }
}
