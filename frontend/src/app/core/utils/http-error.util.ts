import { HttpErrorResponse } from '@angular/common/http';

export interface BackendErrorInfo {
  message: string;
  fieldErrors: Record<string, string>;
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const backendMessage =
      typeof error.error === 'object' && error.error !== null && 'message' in error.error
        ? String((error.error as { message: unknown }).message)
        : '';

    if (backendMessage) {
      return backendMessage;
    }
    return error.message || `HTTP ${error.status}`;
  }

  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const httpError = error as { error?: { message?: string } };
    if (httpError.error?.message) {
      return httpError.error.message;
    }
  }
  return 'An unexpected error occurred';
}

export function extractBackendErrorInfo(error: unknown): BackendErrorInfo {
  const message = extractErrorMessage(error);
  const fieldErrors: Record<string, string> = {};

  if (!(error instanceof HttpErrorResponse)) {
    return { message, fieldErrors };
  }

  const details =
    typeof error.error === 'object' && error.error !== null && 'details' in error.error
      ? (error.error as { details?: { message?: string | string[] } }).details
      : undefined;

  const detailMessages = Array.isArray(details?.message)
    ? details?.message
    : typeof details?.message === 'string'
      ? [details.message]
      : [message];

  for (const item of detailMessages) {
    const msg = String(item);

    const propertyMatch = msg.match(/propertyDetails\.([a-zA-Z0-9_]+)/);
    if (propertyMatch) {
      fieldErrors[`propertyDetails.${propertyMatch[1]}`] = msg;
    }

    const underwritingMatch = msg.match(/underwritingInputs\.([a-zA-Z0-9_]+)/);
    if (underwritingMatch) {
      fieldErrors[`underwritingInputs.${underwritingMatch[1]}`] = msg;
    }

    const brokerMatch = msg.match(/brokers\.(\d+)\.([a-zA-Z0-9_]+)/);
    if (brokerMatch) {
      fieldErrors[`brokers.${brokerMatch[1]}.${brokerMatch[2]}`] = msg;
    }

    const tenantMatch = msg.match(/tenants\.(\d+)\.([a-zA-Z0-9_]+)/);
    if (tenantMatch) {
      fieldErrors[`tenants.${tenantMatch[1]}.${tenantMatch[2]}`] = msg;
    }

    if (msg.toLowerCase().includes('square footage')) {
      fieldErrors['tenants.squareFeet'] = msg;
    }
    if (msg.toLowerCase().includes('lease start')) {
      fieldErrors['tenants.leaseStart'] = msg;
    }
    if (msg.toLowerCase().includes('lease end')) {
      fieldErrors['tenants.leaseEnd'] = msg;
    }
    if (msg.toLowerCase().includes('address is read-only')) {
      fieldErrors['propertyDetails.address'] = msg;
    }
  }

  return { message, fieldErrors };
}
