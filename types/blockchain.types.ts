import type { Address, Hash, Hex } from 'viem';

// Branded types for better type safety
export type TokenId = bigint & { readonly brand: unique symbol };
export type ChainId = number & { readonly brand: unique symbol };
export type Wei = bigint & { readonly brand: unique symbol };
export type Gwei = bigint & { readonly brand: unique symbol };

// Contract-specific types based on existing multicall ABI
export interface ContentData {
  readonly tokenId: TokenId;
  readonly price: Wei;
  readonly nextPrice: Wei;
  readonly rewardForDuration: Wei;
  readonly creator: Address;
  readonly owner: Address;
  readonly uri: string;
}

export interface TokenData {
  readonly index: bigint;
  readonly token: Address;
  readonly quote: Address;
  readonly sale: Address;
  readonly content: Address;
  readonly rewarder: Address;
  readonly owner: Address;
  readonly name: string;
  readonly symbol: string;
  readonly uri: string;
  readonly marketOpen: boolean;
  readonly saleEnd: bigint;
  readonly totalQuoteContributed: Wei;
  readonly marketCap: Wei;
  readonly liquidity: Wei;
  readonly floorPrice: Wei;
  readonly marketPrice: Wei;
  readonly circulatingSupply: bigint;
  readonly maxSupply: bigint;
  readonly contentApr: bigint;
  readonly accountQuoteBalance: Wei;
  readonly accountTokenBalance: bigint;
  readonly accountDebt: Wei;
  readonly accountCredit: Wei;
  readonly accountTransferrable: bigint;
  readonly accountContributed: Wei;
  readonly accountRedeemable: Wei;
  readonly accountContentStaked: bigint;
  readonly accountQuoteEarned: Wei;
  readonly accountTokenEarned: bigint;
  readonly phase: Phase;
}

// Enums for better type safety - must match Multicall.sol
export enum Phase {
  MARKET = 0,
  CONTRI = 1,
  REDEEM = 2,
}

// Transaction types
export interface TransactionRequest {
  readonly to: Address;
  readonly value?: Wei;
  readonly data?: Hex;
  readonly gasLimit?: bigint;
  readonly gasPrice?: Gwei;
}

export interface TransactionReceipt {
  readonly hash: Hash;
  readonly blockNumber: bigint;
  readonly status: 'success' | 'reverted';
  readonly gasUsed: bigint;
  readonly effectiveGasPrice: Gwei;
}

// Error types for better error handling
export interface ContractError {
  readonly name: string;
  readonly message: string;
  readonly code?: string;
  readonly data?: unknown;
}

export interface NetworkError {
  readonly type: 'network';
  readonly message: string;
  readonly chainId?: ChainId;
}

export interface UserRejectedError {
  readonly type: 'user_rejected';
  readonly message: string;
}

export type Web3Error = ContractError | NetworkError | UserRejectedError;

// Type guards
export function isAddress(value: string): value is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isValidTokenId(value: string | number | bigint): value is TokenId {
  try {
    const bigintValue = BigInt(value);
    return bigintValue >= 0n;
  } catch {
    return false;
  }
}

export function isValidChainId(value: number): value is ChainId {
  return Number.isInteger(value) && value > 0;
}

// Utility type helpers
export type ContractCallResult<T> = {
  readonly data: T | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Web3Error | null;
};

export type WriteContractResult = {
  readonly hash: Hash | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Web3Error | null;
  readonly isSuccess: boolean;
};