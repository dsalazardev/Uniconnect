// Common types for FENResponse contract and pagination

export interface PaginationMetadata {
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  timestamp?: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
}

export interface FENResponse<T> {
  success: boolean;
  data: T | null;
  error: ErrorDetails | null;
  metadata: PaginationMetadata;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}
