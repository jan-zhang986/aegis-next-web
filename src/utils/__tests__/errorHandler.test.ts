/**
 * Error Handler Unit Tests
 * 测试不同错误类型的处理和错误提示显示
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import {
  errorHandler,
  createNetworkError,
  createValidationError,
  createBusinessError,
  createDataError,
  toAppError,
  isAppError,
  fetchWithRetry,
  type AppError,
  type NetworkError,
  type ValidationError,
  type BusinessError,
  type DataError,
} from '../errorHandler';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Creation Helpers', () => {
    it('should create network error correctly', () => {
      const error = createNetworkError('Network failed', 500, true);
      
      expect(error.type).toBe('network');
      expect(error.message).toBe('Network failed');
      expect(error.status).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it('should create validation error correctly', () => {
      const error = createValidationError('email', 'Invalid email format');
      
      expect(error.type).toBe('validation');
      expect(error.field).toBe('email');
      expect(error.message).toBe('Invalid email format');
    });

    it('should create business error correctly', () => {
      const error = createBusinessError('TIME_RANGE_EXCEEDED', 'Time range exceeds 6 months');
      
      expect(error.type).toBe('business');
      expect(error.code).toBe('TIME_RANGE_EXCEEDED');
      expect(error.message).toBe('Time range exceeds 6 months');
    });

    it('should create data error correctly', () => {
      const error = createDataError('Data loading failed', { reason: 'timeout' });
      
      expect(error.type).toBe('data');
      expect(error.message).toBe('Data loading failed');
      expect(error.details).toEqual({ reason: 'timeout' });
    });
  });

  describe('Error Type Guard', () => {
    it('should identify AppError correctly', () => {
      const networkError = createNetworkError('Test', 500, true);
      const validationError = createValidationError('field', 'message');
      const businessError = createBusinessError('code', 'message');
      const dataError = createDataError('message');
      
      expect(isAppError(networkError)).toBe(true);
      expect(isAppError(validationError)).toBe(true);
      expect(isAppError(businessError)).toBe(true);
      expect(isAppError(dataError)).toBe(true);
    });

    it('should reject non-AppError objects', () => {
      expect(isAppError(new Error('test'))).toBe(false);
      expect(isAppError('string error')).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({ type: 'invalid', message: 'test' })).toBe(false);
    });
  });

  describe('toAppError Conversion', () => {
    it('should return AppError as-is', () => {
      const error = createNetworkError('Test', 500, true);
      const result = toAppError(error);
      
      expect(result).toBe(error);
    });

    it('should convert Error to DataError', () => {
      const error = new Error('Test error');
      const result = toAppError(error);
      
      expect(result.type).toBe('data');
      expect(result.message).toBe('Test error');
    });

    it('should convert string to DataError', () => {
      const result = toAppError('String error');
      
      expect(result.type).toBe('data');
      expect(result.message).toBe('String error');
    });

    it('should convert unknown to DataError', () => {
      const result = toAppError({ unknown: 'object' });
      
      expect(result.type).toBe('data');
      expect(result.message).toBe('发生未知错误');
    });
  });

  describe('Error Handler - Network Errors', () => {
    it('should show retryable network error with retry message', () => {
      const error = createNetworkError('Connection failed', 500, true);
      
      errorHandler.handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith('Connection failed，请重试');
    });

    it('should show non-retryable network error without retry message', () => {
      const error = createNetworkError('Unauthorized', 401, false);
      
      errorHandler.handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith('Unauthorized');
    });
  });

  describe('Error Handler - Validation Errors', () => {
    it('should show validation error message', () => {
      const error = createValidationError('email', 'Email is required');
      
      errorHandler.handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith('Email is required');
    });
  });

  describe('Error Handler - Business Errors', () => {
    it('should show business error message', () => {
      const error = createBusinessError('ROBOT_DELETED', 'Robot has been deleted');
      
      errorHandler.handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith('Robot has been deleted');
    });
  });

  describe('Error Handler - Data Errors', () => {
    it('should show data error message', () => {
      const error = createDataError('Failed to load data');
      
      errorHandler.handleError(error);
      
      expect(toast.error).toHaveBeenCalledWith('Failed to load data');
    });
  });

  describe('showErrorToast', () => {
    it('should display error toast', () => {
      errorHandler.showErrorToast('Test error message');
      
      expect(toast.error).toHaveBeenCalledWith('Test error message');
    });
  });

  describe('showErrorDialog', () => {
    it('should display error dialog as toast', () => {
      errorHandler.showErrorDialog('Error Title', 'Error message');
      
      expect(toast.error).toHaveBeenCalledWith('Error Title: Error message');
    });
  });

  describe('fetchWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await fetchWithRetry(mockFn, 3, 10);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await fetchWithRetry(mockFn, 3, 10);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(fetchWithRetry(mockFn, 3, 10)).rejects.toThrow('Always fails');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on validation errors', async () => {
      const validationError = createValidationError('field', 'Invalid');
      const mockFn = vi.fn().mockRejectedValue(validationError);
      
      await expect(fetchWithRetry(mockFn, 3, 10)).rejects.toEqual(validationError);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on business errors', async () => {
      const businessError = createBusinessError('CODE', 'Business error');
      const mockFn = vi.fn().mockRejectedValue(businessError);
      
      await expect(fetchWithRetry(mockFn, 3, 10)).rejects.toEqual(businessError);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await fetchWithRetry(mockFn, 3, 100);
      const endTime = Date.now();
      
      // Should wait at least 100ms (first retry) + 200ms (second retry) = 300ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(300);
    });
  });
});
