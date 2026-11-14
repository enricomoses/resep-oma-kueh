import 'server-only';

export interface ServerLogEvent {
  requestId: string;
  route: string;
  operation: string;
  status: number;
  durationMs: number;
  count?: number;
  errorCode?: string;
  branchId?: string | null;
  branchCode?: string | null;
  mode?: string;
  fallbackReason?: string;
}

/**
 * Emits a sanitized structured operational log for BFF routes (PRD §19.5 & §27.7).
 * Strictly whitelists operational fields; never log raw bodies, chat prompts,
 * emails, passwords, customer names, delivery addresses, or WhatsApp texts.
 */
export function logServerEvent(event: ServerLogEvent): void {
  const sanitized = {
    requestId: event.requestId,
    route: event.route,
    operation: event.operation,
    status: event.status,
    durationMs: Math.max(0, Math.round(event.durationMs)),
    ...(typeof event.count === 'number' ? { count: event.count } : {}),
    ...(event.errorCode ? { errorCode: event.errorCode } : {}),
    ...(event.branchId ? { branchId: event.branchId } : {}),
    ...(event.branchCode ? { branchCode: event.branchCode } : {}),
    ...(event.mode ? { mode: event.mode } : {}),
    ...(event.fallbackReason ? { fallbackReason: event.fallbackReason } : {}),
  };

  if (event.status >= 500) {
    console.error('[bakery-api]', sanitized);
    return;
  }
  console.info('[bakery-api]', sanitized);
}
