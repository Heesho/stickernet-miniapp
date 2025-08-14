# TypeScript Type-Checker Expert Guide

This guide provides comprehensive instructions for implementing strict TypeScript typing in your StickerNet Web3 application.

## Quick Start

1. **Switch to Strict Configuration**
   ```bash
   # Use the enhanced strict TypeScript config
   mv tsconfig.json tsconfig.base.json
   mv tsconfig.strict.json tsconfig.json
   ```

2. **Import Types in Your Components**
   ```typescript
   import type { Address, TokenId, ContentData } from '@/types';
   ```

3. **Use the Agent Configuration**
   ```bash
   # Reference the agent config for TypeScript best practices
   cat typescript-expert-agent.json
   ```

## Project Structure

```
types/
├── index.ts              # Barrel exports for all types
├── blockchain.types.ts   # Web3 and blockchain-specific types
├── api.types.ts         # API response and webhook types
├── components.types.ts  # React component prop types
└── hooks.types.ts       # Custom hook return types
```

## TypeScript Configuration

### Current Enhanced Settings

The `tsconfig.strict.json` includes these key enhancements:

- `noUncheckedIndexedAccess: true` - Prevents accessing array/object properties without checking
- `exactOptionalPropertyTypes: true` - Strict optional property handling
- `noImplicitReturns: true` - Ensures all code paths return a value
- `noFallthroughCasesInSwitch: true` - Prevents switch fallthrough bugs
- `useUnknownInCatchVariables: true` - Safer error handling

### Recommended Additional Tools

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev typescript-strict-plugin
```

## Web3-Specific Type Safety

### 1. Address Validation
```typescript
import { isAddress, type Address } from '@/types';

function useTokenData(tokenAddress: string) {
  if (!isAddress(tokenAddress)) {
    throw new Error('Invalid address format');
  }
  // Now tokenAddress is typed as Address
  return useReadContract({
    address: tokenAddress, // ✅ Type-safe
    // ...
  });
}
```

### 2. Branded Types for Better Safety
```typescript
import type { TokenId, Wei } from '@/types';

// Instead of using raw bigint, use branded types
const tokenId: TokenId = BigInt(123) as TokenId;
const price: Wei = BigInt('1000000') as Wei;
```

### 3. Contract Data Typing
```typescript
import type { ContentData, TokenData } from '@/types';

export function useContentData(tokenAddress: Address, tokenId: TokenId) {
  const { data, isError, isLoading } = useReadContract({
    // ... contract config
  });

  return {
    contentData: data as ContentData | undefined,
    weeklyReward: data?.rewardForDuration ? formatUnits(data.rewardForDuration, 18) : '0',
    price: data?.price ? formatUnits(data.price, 6) : '0',
    nextPrice: data?.nextPrice ? formatUnits(data.nextPrice, 6) : '0',
    isLoading,
    isError
  } satisfies UseContentDataReturn;
}
```

## Component Type Safety

### 1. Strict Prop Interfaces
```typescript
import type { ContentDisplayProps } from '@/types';

export function ContentDisplay({ 
  tokenAddress, 
  tokenId, 
  contentData,
  isLoading = false,
  onError 
}: ContentDisplayProps) {
  // Component implementation
}
```

### 2. Form Type Safety
```typescript
import type { UseFormReturn, ValidationResult } from '@/types';

interface CreateTokenForm {
  name: string;
  symbol: string;
  initialPrice: number;
}

export function useCreateTokenForm(): UseFormReturn<CreateTokenForm> {
  // Form logic with strict typing
}
```

### 3. Event Handler Typing
```typescript
import type { ClickHandler, ChangeHandler } from '@/types';

interface ButtonProps {
  onClick: ClickHandler;
  disabled?: boolean;
}

interface InputProps {
  value: string;
  onChange: ChangeHandler<string>;
}
```

## API Type Safety

### 1. Webhook Handling
```typescript
import type { WebhookRequest, WebhookEvent, WebhookEventType } from '@/types';
import { isWebhookEventType } from '@/types';

export async function POST(request: Request) {
  const requestJson: WebhookRequest = await request.json();
  
  const event: WebhookEvent = decode(requestJson.payload);
  
  if (!isWebhookEventType(event.event)) {
    return Response.json({ error: 'Invalid event type' }, { status: 400 });
  }
  
  // Now event.event is properly typed
  switch (event.event) {
    case 'frame_added':
      // Handle frame added
      break;
    // ... other cases
  }
}
```

### 2. API Response Typing
```typescript
import type { ApiResponse, ApiError } from '@/types';
import { isApiSuccess, isApiError } from '@/types';

async function fetchUserData(fid: number): Promise<ApiResponse<UserData>> {
  const response = await fetch(`/api/users/${fid}`);
  const data: ApiResponse<UserData> = await response.json();
  
  if (isApiSuccess(data)) {
    // data.data is guaranteed to be UserData
    return data;
  }
  
  if (isApiError(data)) {
    // data.error is guaranteed to be ApiError
    throw new Error(data.error.message);
  }
  
  throw new Error('Invalid response format');
}
```

## Error Handling Patterns

### 1. Discriminated Union for Errors
```typescript
import type { Web3Error, ContractError, NetworkError } from '@/types';

function handleWeb3Error(error: Web3Error) {
  switch (error.type) {
    case 'network':
      console.error('Network error:', error.message, 'Chain:', error.chainId);
      break;
    case 'user_rejected':
      console.log('User rejected transaction');
      break;
    default:
      // ContractError
      console.error('Contract error:', error.name, error.message);
  }
}
```

### 2. Result Pattern for Safe Operations
```typescript
import type { ValidationResult } from '@/types';

function validateTokenAddress(address: string): ValidationResult<Address> {
  if (!isAddress(address)) {
    return {
      isValid: false,
      errors: [{
        field: 'address',
        message: 'Invalid Ethereum address format',
        code: 'INVALID_ADDRESS'
      }]
    };
  }
  
  return {
    isValid: true,
    data: address,
    errors: []
  };
}
```

## Performance Considerations

### 1. Type-Only Imports
```typescript
import type { Address, TokenId } from '@/types';
import { isAddress } from '@/types'; // Only import runtime code when needed
```

### 2. Conditional Types for Hook Optimization
```typescript
type ConditionalData<T, TEnabled extends boolean> = 
  TEnabled extends true ? T : T | undefined;

function useConditionalData<TEnabled extends boolean = true>(
  enabled: TEnabled
): ConditionalData<UserData, TEnabled> {
  // Implementation
}
```

## Code Quality Standards

### 1. Naming Conventions
- Interfaces: `IUserData`, `IApiResponse`
- Types: `TTokenData`, `TContractState`
- Enums: `Phase`, `TransactionStatus`
- Generics: `T`, `U`, `V` or descriptive names like `TData`, `TParams`

### 2. Documentation Standards
```typescript
/**
 * Retrieves content data for a specific token
 * @param tokenAddress - The contract address of the token
 * @param tokenId - The unique identifier for the content
 * @returns Promise resolving to content data with pricing information
 * @throws {ContractError} When contract call fails
 * @throws {NetworkError} When network is unavailable
 */
export async function getContentData(
  tokenAddress: Address, 
  tokenId: TokenId
): Promise<ContentData> {
  // Implementation
}
```

### 3. Type Organization
```typescript
// Group related types together
export namespace Token {
  export interface Data {
    // Token data fields
  }
  
  export interface Metadata {
    // Metadata fields
  }
  
  export type Status = 'active' | 'inactive' | 'pending';
}
```

## Migration Strategy

### 1. Gradual Adoption
1. Start with new files using strict types
2. Migrate existing files one module at a time
3. Use `// @ts-expect-error` for temporary exceptions
4. Add type tests for critical paths

### 2. Common Migration Patterns
```typescript
// Before (loose typing)
function getUserData(id: any): any {
  return fetch(`/api/users/${id}`).then(r => r.json());
}

// After (strict typing)
async function getUserData(id: number): Promise<ApiResponse<UserData>> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

## Testing Type Safety

### 1. Type Tests
```typescript
// types/__tests__/type-tests.ts
import type { Address, TokenId } from '@/types';
import { isAddress, isValidTokenId } from '@/types';

// Test type guards
const validAddress: string = '0x742C4B3B7FF6B8F4B5C7B5A5E4C3B2A5B4C3B2A1';
if (isAddress(validAddress)) {
  // validAddress is now typed as Address
  const address: Address = validAddress; // ✅ Should compile
}

// Test branded types
const tokenId: TokenId = BigInt(123) as TokenId;
const regularBigInt: bigint = BigInt(456);
// const invalid: TokenId = regularBigInt; // ❌ Should not compile
```

### 2. Runtime Validation
```typescript
import { z } from 'zod';
import type { Address } from '@/types';

const AddressSchema = z.string().refine(isAddress, 'Invalid address');

export function validateUserInput(input: unknown): Address {
  return AddressSchema.parse(input) as Address;
}
```

## Best Practices Summary

1. **Always use type guards** for runtime validation
2. **Prefer branded types** over primitive types for domain concepts
3. **Use discriminated unions** for error handling
4. **Implement proper generic constraints** to prevent type pollution
5. **Document complex types** with JSDoc comments
6. **Test type safety** with both compile-time and runtime checks
7. **Gradually migrate** existing code to strict typing
8. **Use barrel exports** for clean import patterns
9. **Leverage utility types** instead of recreating common patterns
10. **Keep performance in mind** with type-only imports

## Common Issues and Solutions

### Issue: OnchainKit Type Conflicts
```typescript
// Solution: Create wrapper types
import type { TransactionReceipt as ViemReceipt } from 'viem';
import type { TransactionReceipt as OnchainKitReceipt } from '@coinbase/onchainkit';

export type AppTransactionReceipt = ViemReceipt & {
  onchainKitData?: OnchainKitReceipt;
};
```

### Issue: Wagmi Hook Type Inference
```typescript
// Solution: Explicit return type annotation
export function useTypedContract(): UseReadContractReturn<ContentData> {
  return useReadContract({
    // ... config
  }) as UseReadContractReturn<ContentData>;
}
```

This guide should help you implement comprehensive TypeScript type safety across your StickerNet application. Use the agent configuration (`typescript-expert-agent.json`) as a reference for additional patterns and best practices.