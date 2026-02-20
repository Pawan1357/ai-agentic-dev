export interface SuccessResponse<T> {
  success: true;
  message: string;
  path: string;
  timestamp: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  statusCode: number;
  path: string;
  timestamp: string;
  details?: unknown;
}
