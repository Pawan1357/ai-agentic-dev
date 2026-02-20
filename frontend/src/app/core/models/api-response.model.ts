export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  path: string;
  timestamp: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  statusCode: number;
  path: string;
  timestamp: string;
  details?: unknown;
}
