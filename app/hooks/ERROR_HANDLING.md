# Standardized Error Handling System

This document describes the standardized error handling system implemented across all hooks in the application.

## Overview

The error handling system provides:
- **Consistent error types and messages** across all hooks
- **Automatic error categorization** (network, validation, contract, etc.)
- **User-friendly error messages** with recovery suggestions
- **Proper logging** without console.log pollution
- **Retry logic** with intelligent retry strategies
- **Toast notifications** for appropriate error severities

## Core Components

### 1. `useErrorHandler` Hook

The main error handling hook that provides comprehensive error management:

```typescript
import { useErrorHandler } from './useErrorHandler';

const errorHandler = useErrorHandler({
  hookName: 'MyHook',
  showToast: true,
  enableLogging: true,
  customErrorMapper: (error) => ({
    // Custom error mapping logic
  })
});
```

### 2. `useAsyncErrorHandler` Hook

Specialized for async operations with built-in try/catch wrapper:

```typescript
import { useAsyncErrorHandler } from './useErrorHandler';

const errorHandler = useAsyncErrorHandler({
  hookName: 'MyAsyncHook'
});

const result = await errorHandler.executeWithErrorHandling(async () => {
  // Your async operation
  return await someAsyncOperation();
}, { context: 'operation_context' });
```

### 3. `StandardError` Interface

All errors are normalized to this structure:

```typescript
interface StandardError {
  id: string;                    // Unique error identifier
  category: ErrorCategory;       // Error category for handling
  severity: ErrorSeverity;       // Severity level
  code?: string | number;        // Technical error code
  message: string;              // Raw error message
  userMessage: string;          // User-friendly message
  details?: string;             // Additional details
  retryable: boolean;           // Whether error can be retried
  recoveryAction: RecoveryAction; // Suggested recovery action
  recoverySuggestion: string;   // Recovery suggestion text
  timestamp: number;            // When error occurred
  context?: Record<string, any>; // Additional context
}
```

## Error Categories

The system categorizes errors into the following types:

- **`network`** - Connection issues, RPC failures
- **`validation`** - Input validation errors
- **`contract`** - Smart contract execution errors
- **`wallet`** - Wallet connection/interaction errors
- **`api`** - External API failures
- **`permission`** - Access denied errors
- **`ratelimit`** - Rate limiting errors
- **`timeout`** - Operation timeouts
- **`unknown`** - Unclassified errors

## Error Severity Levels

- **`low`** - User actions (cancellations), minor issues
- **`medium`** - Network issues, temporary failures
- **`high`** - Contract failures, validation errors
- **`critical`** - System failures, security issues

## Recovery Actions

- **`retry`** - Operation can be retried
- **`refresh`** - Page/data refresh recommended
- **`reconnect`** - Wallet reconnection needed
- **`switch_network`** - Network switch required
- **`contact_support`** - Support contact needed
- **`wait`** - Wait before retrying
- **`none`** - No specific action

## Usage Examples

### Basic Error Handling

```typescript
export function useMyHook() {
  const errorHandler = useErrorHandler({
    hookName: 'useMyHook',
    showToast: true,
    enableLogging: true
  });

  const performOperation = () => {
    try {
      // Your operation
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'operation_details'
      });
    }
  };

  return {
    error: errorHandler.error,
    hasError: errorHandler.hasError,
    canRetry: errorHandler.canRetry,
    retry: errorHandler.retry,
    performOperation
  };
}
```

### Async Error Handling

```typescript
export function useAsyncHook() {
  const errorHandler = useAsyncErrorHandler({
    hookName: 'useAsyncHook',
    customErrorMapper: (error) => {
      if (error.code === 'SPECIFIC_ERROR') {
        return {
          category: 'contract',
          userMessage: 'Custom error message',
          retryable: false
        };
      }
      return {};
    }
  });

  const performAsyncOperation = async () => {
    const result = await errorHandler.executeWithErrorHandling(
      async () => {
        return await someAsyncCall();
      },
      { operation: 'async_operation' }
    );

    return result;
  };

  return {
    error: errorHandler.error,
    hasError: errorHandler.hasError,
    performAsyncOperation
  };
}
```

### Wagmi Hook Integration

```typescript
export function useContractHook() {
  const errorHandler = useErrorHandler({
    hookName: 'useContractHook',
    showToast: false // Let wagmi handle toasts
  });

  const { data, error, isLoading } = useReadContract({
    // ... contract config
  });

  // Handle wagmi errors
  if (error) {
    errorHandler.handleError(error);
  }

  return {
    data,
    isLoading,
    error: errorHandler.error,
    hasError: errorHandler.hasError
  };
}
```

## Error Mapping Patterns

The system automatically categorizes errors based on common patterns:

### Network Errors
- Messages containing: `network`, `rpc`, `connection`, `timeout`, `fetch`
- Category: `network`
- Severity: `medium`
- Retryable: `true`

### Wallet Errors
- Messages containing: `wallet`, `metamask`, `coinbase`, `rejected`, `denied`
- Category: `wallet`
- Severity: `low`
- Retryable: `true`

### Contract Errors
- Messages containing: `revert`, `insufficient`, `gas`, `slippage`, `deadline`
- Category: `contract`
- Severity: `high`
- Retryable: `false`

### Validation Errors
- Messages containing: `invalid`, `required`, `missing`, `malformed`
- Category: `validation`
- Severity: `medium`
- Retryable: `false`

## Best Practices

### 1. Always Use Error Handlers
```typescript
// ✅ Good
const errorHandler = useErrorHandler({ hookName: 'MyHook' });

// ❌ Bad
const [error, setError] = useState<string | null>(null);
```

### 2. Provide Context
```typescript
// ✅ Good
errorHandler.handleError(error, {
  tokenAddress,
  amount,
  operation: 'buy_tokens'
});

// ❌ Bad
errorHandler.handleError(error);
```

### 3. Use Custom Error Mapping
```typescript
// ✅ Good
const errorHandler = useErrorHandler({
  customErrorMapper: (error) => {
    if (error.code === 'INSUFFICIENT_BALANCE') {
      return {
        userMessage: 'Not enough tokens in your wallet',
        recoverySuggestion: 'Please buy more tokens or reduce the amount.'
      };
    }
    return {};
  }
});
```

### 4. Handle Different Severities Appropriately
```typescript
// ✅ Good - No toast for low severity errors
const errorHandler = useErrorHandler({
  showToast: errorSeverity !== 'low'
});
```

### 5. Implement Retry Logic
```typescript
// ✅ Good
if (errorHandler.canRetry) {
  errorHandler.setRetryFunction(() => performOperation());
}
```

## Migration Guide

### From Old Error Handling

```typescript
// ❌ Old way
const [error, setError] = useState<string | null>(null);

try {
  await operation();
} catch (err) {
  setError(err.message);
  console.error('Operation failed:', err);
  toast.error('Something went wrong');
}

// ✅ New way
const errorHandler = useAsyncErrorHandler({
  hookName: 'MyHook'
});

const result = await errorHandler.executeWithErrorHandling(
  () => operation(),
  { context: 'operation_details' }
);
```

### Updating Return Types

```typescript
// ❌ Old interface
interface MyHookReturn {
  error: string | null;
}

// ✅ New interface
interface MyHookReturn {
  error: StandardError | null;
  hasError: boolean;
}
```

## Testing Error Handling

### Unit Tests

```typescript
describe('useMyHook', () => {
  it('should handle network errors correctly', () => {
    const networkError = new Error('Network connection failed');
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.handleError(networkError);
    });

    expect(result.current.error?.category).toBe('network');
    expect(result.current.error?.retryable).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Error handling integration', () => {
  it('should show appropriate toast for high severity errors', () => {
    const mockToast = jest.spyOn(toast, 'error');
    const criticalError = new Error('Critical system failure');
    
    const { result } = renderHook(() => useErrorHandler({
      hookName: 'TestHook'
    }));

    act(() => {
      result.current.handleError(criticalError);
    });

    expect(mockToast).toHaveBeenCalled();
  });
});
```

## Error Monitoring

The system provides comprehensive logging for error monitoring:

```typescript
// Error logs include:
{
  hookName: 'useMyHook',
  errorId: 'err_1234567890_abc123',
  category: 'network',
  severity: 'medium',
  message: 'Network connection failed',
  userMessage: 'Connection issue detected',
  retryable: true,
  context: {
    tokenAddress: '0x...',
    operation: 'fetch_price'
  },
  timestamp: 1234567890123
}
```

This enables:
- **Error tracking** across the application
- **Pattern identification** for common failures
- **Performance monitoring** for retry success rates
- **User experience optimization** based on error frequency

## Troubleshooting

### Common Issues

1. **Error not being caught**
   - Ensure you're using `executeWithErrorHandling` for async operations
   - Check that error handlers are properly initialized

2. **Toast not showing**
   - Verify `showToast: true` in error handler config
   - Check error severity (low severity errors don't show toasts by default)

3. **Retry not working**
   - Ensure `setRetryFunction` is called with a valid function
   - Check that error is marked as `retryable: true`

4. **Custom error mapping not applied**
   - Verify `customErrorMapper` returns the correct object structure
   - Check that the mapping logic matches the error conditions

### Debug Mode

Enable detailed logging for debugging:

```typescript
const errorHandler = useErrorHandler({
  hookName: 'DebugHook',
  enableLogging: true, // Enable console logging
  showToast: true // Show all toasts for testing
});
```