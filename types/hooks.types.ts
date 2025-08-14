import type { Address } from 'viem';
import type { TokenId, ContentData, TokenData, Web3Error } from './blockchain.types';
import type { NotificationResult } from './api.types';

// Base hook return type
export interface BaseHookReturn {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Web3Error | Error | null;
}

// Contract reading hooks
export interface UseReadContractReturn<T> extends BaseHookReturn {
  readonly data: T | undefined;
  readonly refetch: () => Promise<void>;
}

// Contract writing hooks
export interface UseWriteContractReturn extends BaseHookReturn {
  readonly write: (args?: readonly unknown[]) => Promise<void>;
  readonly writeAsync: (args?: readonly unknown[]) => Promise<`0x${string}`>;
  readonly reset: () => void;
  readonly isSuccess: boolean;
  readonly hash: `0x${string}` | undefined;
}

// Specific multicall hooks
export interface UseContentDataParams {
  readonly tokenAddress: Address | undefined;
  readonly tokenId: TokenId | undefined;
  readonly enabled?: boolean;
}

export interface UseContentDataReturn extends BaseHookReturn {
  readonly contentData: ContentData | undefined;
  readonly weeklyReward: string;
  readonly price: string;
  readonly nextPrice: string;
}

export interface UseTokenDataParams {
  readonly tokenAddress: Address | undefined;
  readonly account: Address | undefined;
  readonly enabled?: boolean;
}

export interface UseTokenDataReturn extends BaseHookReturn {
  readonly tokenData: TokenData | undefined;
}

// Wallet connection hooks
export interface UseWalletReturn extends BaseHookReturn {
  readonly address: Address | undefined;
  readonly isConnected: boolean;
  readonly isConnecting: boolean;
  readonly isDisconnected: boolean;
  readonly chainId: number | undefined;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly switchChain: (chainId: number) => Promise<void>;
}

// Transaction hooks
export interface UseTransactionReturn extends BaseHookReturn {
  readonly sendTransaction: (request: {
    to: Address;
    value?: bigint;
    data?: `0x${string}`;
  }) => Promise<`0x${string}`>;
  readonly isIdle: boolean;
  readonly isPending: boolean;
  readonly isSuccess: boolean;
  readonly hash: `0x${string}` | undefined;
}

// Balance hooks
export interface UseBalanceParams {
  readonly address: Address | undefined;
  readonly token?: Address;
  readonly chainId?: number;
  readonly enabled?: boolean;
}

export interface UseBalanceReturn extends BaseHookReturn {
  readonly balance: bigint | undefined;
  readonly formatted: string;
  readonly symbol: string;
  readonly decimals: number;
}

// ENS hooks
export interface UseEnsNameParams {
  readonly address: Address | undefined;
  readonly enabled?: boolean;
}

export interface UseEnsNameReturn extends BaseHookReturn {
  readonly ensName: string | null;
}

export interface UseEnsAddressParams {
  readonly name: string | undefined;
  readonly enabled?: boolean;
}

export interface UseEnsAddressReturn extends BaseHookReturn {
  readonly address: Address | null;
}

// Notification hooks
export interface UseNotificationParams {
  readonly fid: number;
}

export interface UseNotificationReturn extends BaseHookReturn {
  readonly sendNotification: (params: {
    title: string;
    body: string;
  }) => Promise<NotificationResult>;
  readonly isSending: boolean;
}

// Form hooks
export interface UseFormReturn<T> {
  readonly values: T;
  readonly errors: Partial<Record<keyof T, string>>;
  readonly touched: Partial<Record<keyof T, boolean>>;
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
  readonly setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  readonly setError: <K extends keyof T>(field: K, error: string) => void;
  readonly clearError: <K extends keyof T>(field: K) => void;
  readonly handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (event?: React.FormEvent) => Promise<void>;
  readonly reset: (values?: Partial<T>) => void;
}

// Local storage hooks
export interface UseLocalStorageReturn<T> {
  readonly value: T;
  readonly setValue: (value: T | ((prev: T) => T)) => void;
  readonly removeValue: () => void;
}

// Debounced value hook
export interface UseDebounceReturn<T> {
  readonly debouncedValue: T;
  readonly isDebouncing: boolean;
}

// Media query hook
export interface UseMediaQueryReturn {
  readonly matches: boolean;
}

// Previous value hook
export interface UsePreviousReturn<T> {
  readonly previous: T | undefined;
}

// Async hook pattern
export interface UseAsyncReturn<T, P extends readonly unknown[] = readonly unknown[]> extends BaseHookReturn {
  readonly execute: (...params: P) => Promise<T>;
  readonly result: T | undefined;
  readonly reset: () => void;
}

// Copy to clipboard hook
export interface UseCopyToClipboardReturn {
  readonly copy: (text: string) => Promise<boolean>;
  readonly copied: boolean;
  readonly reset: () => void;
}

// Window size hook
export interface UseWindowSizeReturn {
  readonly width: number;
  readonly height: number;
}

// Type helpers for hook factories
export type HookFactory<TParams, TReturn> = (params: TParams) => TReturn;

export type AsyncHook<TResult, TParams extends readonly unknown[] = readonly unknown[]> = 
  UseAsyncReturn<TResult, TParams>;

// Conditional hook types
export type ConditionalHook<T, TCondition> = TCondition extends true ? T : T | undefined;