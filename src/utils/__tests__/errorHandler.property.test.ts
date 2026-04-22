/**
 * Error Handler Property-Based Tests
 * Feature: project-message-log-migration
 * Property 29: API 错误统一处理
 * Validates: Requirements 8.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { toast } from 'sonner';
import {
  errorHandler,
  createNetworkError,
  createValidationError,
  createBusinessError,
  createDataError,
  toAppError,
  isAppError,
  type AppError,
} from '../errorHandler';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('Property Tests - Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: project-message-log-migration, Property 29: API 错误统一处理
   * 
   * For any API error (network, validation, business, or data error),
   * the system should use the unified error handler to display a user-friendly error message.
   * 
   * **Validates: Requirements 8.4**
   */
  it('Property 29: API 错误统一处理 - All API errors should be handled uniformly', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Network errors
          fc.record({
            type: fc.constant('network' as const),
            message: fc.string({ minLength: 1 }),
            status: fc.option(fc.integer({ min: 100, max: 599 }), { nil: undefined }),
            retryable: fc.boolean(),
          }),
          // Validation errors
          fc.record({
            type: fc.constant('validation' as const),
            message: fc.string({ minLength: 1 }),
            field: fc.string({ minLength: 1 }),
          }),
          // Business errors
          fc.record({
            type: fc.constant('business' as const),
            message: fc.string({ minLength: 1 }),
            code: fc.string({ minLength: 1 }),
          }),
          // Data errors
          fc.record({
            type: fc.constant('data' as const),
            message: fc.string({ minLength: 1 }),
            details: fc.option(fc.anything(), { nil: undefined }),
          })
        ),
        (error: AppError) => {
          // Clear previous calls
          vi.clearAllMocks();
          
          // Handle the error
          errorHandler.handleError(error);
          
          // Verify that toast.error was called exactly once
          expect(toast.error).toHaveBeenCalledTimes(1);
          
          // Verify that the error message was displayed
          const callArgs = (toast.error as any).mock.calls[0];
          expect(callArgs).toBeDefined();
          expect(callArgs[0]).toBeTruthy();
          expect(typeof callArgs[0]).toBe('string');
          
          // Verify that the message contains meaningful content
          const displayedMessage = callArgs[0] as string;
          expect(displayedMessage.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error type preservation
   * 
   * For any AppError, converting it with toAppError should return the same error.
   */
  it('Property: toAppError preserves AppError type', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            type: fc.constant('network' as const),
            message: fc.string({ minLength: 1 }),
            status: fc.option(fc.integer({ min: 100, max: 599 }), { nil: undefined }),
            retryable: fc.boolean(),
          }),
          fc.record({
            type: fc.constant('validation' as const),
            message: fc.string({ minLength: 1 }),
            field: fc.string({ minLength: 1 }),
          }),
          fc.record({
            type: fc.constant('business' as const),
            message: fc.string({ minLength: 1 }),
            code: fc.string({ minLength: 1 }),
          }),
          fc.record({
            type: fc.constant('data' as const),
            message: fc.string({ minLength: 1 }),
            details: fc.option(fc.anything(), { nil: undefined }),
          })
        ),
        (error: AppError) => {
          const converted = toAppError(error);
          
          // Should return the same error object
          expect(converted).toBe(error);
          expect(converted.type).toBe(error.type);
          expect(converted.message).toBe(error.message);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error type guard correctness
   * 
   * For any AppError, isAppError should return true.
   * For any non-AppError, isAppError should return false.
   */
  it('Property: isAppError correctly identifies AppErrors', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Valid AppErrors
          fc.record({
            type: fc.constant('network' as const),
            message: fc.string({ minLength: 1 }),
            status: fc.option(fc.integer({ min: 100, max: 599 }), { nil: undefined }),
            retryable: fc.boolean(),
          }),
          fc.record({
            type: fc.constant('validation' as const),
            message: fc.string({ minLength: 1 }),
            field: fc.string({ minLength: 1 }),
          }),
          fc.record({
            type: fc.constant('business' as const),
            message: fc.string({ minLength: 1 }),
            code: fc.string({ minLength: 1 }),
          }),
          fc.record({
            type: fc.constant('data' as const),
            message: fc.string({ minLength: 1 }),
            details: fc.option(fc.anything(), { nil: undefined }),
          })
        ),
        (error: AppError) => {
          // Should identify as AppError
          expect(isAppError(error)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Non-AppError rejection
   * 
   * For any non-AppError value, isAppError should return false.
   */
  it('Property: isAppError rejects non-AppErrors', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
          fc.array(fc.anything()),
          fc.record({
            type: fc.constantFrom('invalid', 'unknown', 'other'),
            message: fc.string(),
          })
        ),
        (value: any) => {
          // Should not identify as AppError
          expect(isAppError(value)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Network error retryable message
   * 
   * For any retryable network error, the displayed message should include retry hint.
   * For any non-retryable network error, the displayed message should not include retry hint.
   */
  it('Property: Network error retryable message correctness', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.option(fc.integer({ min: 100, max: 599 }), { nil: undefined }),
        fc.boolean(),
        (message: string, status: number | undefined, retryable: boolean) => {
          vi.clearAllMocks();
          
          const error = createNetworkError(message, status, retryable);
          errorHandler.handleError(error);
          
          const callArgs = (toast.error as any).mock.calls[0];
          const displayedMessage = callArgs[0] as string;
          
          if (retryable) {
            // Should include retry hint
            expect(displayedMessage).toContain('请重试');
          } else {
            // Should not include retry hint
            expect(displayedMessage).not.toContain('请重试');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error message preservation
   * 
   * For any error with a message, the displayed error should contain that message.
   */
  it('Property: Error messages are preserved in display', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5 }), // Ensure message is long enough to be meaningful
        fc.constantFrom('network', 'validation', 'business', 'data'),
        (message: string, errorType: 'network' | 'validation' | 'business' | 'data') => {
          vi.clearAllMocks();
          
          let error: AppError;
          switch (errorType) {
            case 'network':
              error = createNetworkError(message, 500, true);
              break;
            case 'validation':
              error = createValidationError('field', message);
              break;
            case 'business':
              error = createBusinessError('CODE', message);
              break;
            case 'data':
              error = createDataError(message);
              break;
          }
          
          errorHandler.handleError(error);
          
          const callArgs = (toast.error as any).mock.calls[0];
          const displayedMessage = callArgs[0] as string;
          
          // The displayed message should contain the original message
          // (may have additional text like "请重试" for retryable network errors)
          expect(displayedMessage).toContain(message);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
