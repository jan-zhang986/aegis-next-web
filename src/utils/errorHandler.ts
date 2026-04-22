/**
 * Error Handler Utility
 * 
 * Provides unified error handling for the message and log management features.
 * Supports different error types and provides consistent user feedback.
 */

import { toast } from 'sonner';

/**
 * Error types supported by the error handler
 */
export type AppErrorType = 'network' | 'validation' | 'business' | 'data';

/**
 * Base error interface
 */
export interface BaseError {
  type: AppErrorType;
  message: string;
}

/**
 * Network error - API request failures, timeouts, connection issues
 */
export interface NetworkError extends BaseError {
  type: 'network';
  status?: number;
  retryable: boolean;
}

/**
 * Validation error - Form field validation failures, missing required fields
 */
export interface ValidationError extends BaseError {
  type: 'validation';
  field: string;
}

/**
 * Business logic error - Time range limits, deleted resources, permissions
 */
export interface BusinessError extends BaseError {
  type: 'business';
  code: string;
}

/**
 * Data error - Data loading/saving failures, format mismatches
 */
export interface DataError extends BaseError {
  type: 'data';
  details?: any;
}

/**
 * Union type of all error types
 */
export type AppError = NetworkError | ValidationError | BusinessError | DataError;

/**
 * Error handler interface
 */
export interface ErrorHandler {
  handleError(error: AppError): void;
  showErrorToast(message: string): void;
  showErrorDialog(title: string, message: string): void;
}

/**
 * Default error handler implementation
 */
class DefaultErrorHandler implements ErrorHandler {
  /**
   * Handle different types of errors with appropriate user feedback
   */
  handleError(error: AppError): void {
    switch (error.type) {
      case 'network':
        this.handleNetworkError(error);
        break;
      
      case 'validation':
        this.handleValidationError(error);
        break;
      
      case 'business':
        this.handleBusinessError(error);
        break;
      
      case 'data':
        this.handleDataError(error);
        break;
      
      default:
        this.showErrorToast('发生未知错误');
    }
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(error: NetworkError): void {
    if (error.retryable) {
      this.showErrorToast(`${error.message}，请重试`);
    } else {
      this.showErrorToast(error.message);
    }
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(error: ValidationError): void {
    this.showErrorToast(error.message);
  }

  /**
   * Handle business logic errors
   */
  private handleBusinessError(error: BusinessError): void {
    this.showErrorToast(error.message);
  }

  /**
   * Handle data errors
   */
  private handleDataError(error: DataError): void {
    this.showErrorToast(error.message);
  }

  /**
   * Show error toast notification
   */
  showErrorToast(message: string): void {
    toast.error(message);
  }

  /**
   * Show error dialog (using toast for now, can be extended to use Dialog component)
   */
  showErrorDialog(title: string, message: string): void {
    toast.error(`${title}: ${message}`);
  }
}

/**
 * Singleton instance of the error handler
 */
export const errorHandler: ErrorHandler = new DefaultErrorHandler();

/**
 * Helper function to create a network error
 */
export function createNetworkError(
  message: string,
  status?: number,
  retryable: boolean = true
): NetworkError {
  return {
    type: 'network',
    message,
    status,
    retryable,
  };
}

/**
 * Helper function to create a validation error
 */
export function createValidationError(field: string, message: string): ValidationError {
  return {
    type: 'validation',
    field,
    message,
  };
}

/**
 * Helper function to create a business error
 */
export function createBusinessError(code: string, message: string): BusinessError {
  return {
    type: 'business',
    code,
    message,
  };
}

/**
 * Helper function to create a data error
 */
export function createDataError(message: string, details?: any): DataError {
  return {
    type: 'data',
    message,
    details,
  };
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createDataError(error.message);
  }

  if (typeof error === 'string') {
    return createDataError(error);
  }

  return createDataError('发生未知错误');
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    ['network', 'validation', 'business', 'data'].includes((error as any).type)
  );
}

/**
 * Fetch with retry logic for network errors
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | AppError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error | AppError;
      
      // Don't retry on validation or business errors
      if (isAppError(error) && (error.type === 'validation' || error.type === 'business')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await delay(delayMs * Math.pow(2, i));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Delay helper function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
