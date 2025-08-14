/**
 * Router contract types and interfaces
 */

import type { Address } from 'viem';

/**
 * Parameters for curateContent function
 */
export interface CurateContentParams {
  tokenAddress: Address;
  tokenId: bigint;
  nextPrice: bigint;
}

/**
 * Parameters for batch curate transaction (approve + curateContent)
 */
export interface BatchCurateParams {
  tokenAddress: Address;
  tokenId: bigint;
  nextPrice: bigint;
  userAddress: Address;
}

/**
 * Transaction status for batch operations
 */
export interface BatchTransactionStatus {
  approveStatus: 'idle' | 'pending' | 'success' | 'error';
  curateStatus: 'idle' | 'pending' | 'success' | 'error';
  approveHash?: string;
  curateHash?: string;
  error?: string;
}

/**
 * Hook return type for curate content
 */
export interface UseCurateContentReturn {
  curate: (params: CurateContentParams) => Promise<void>;
  isLoading: boolean;
  status: BatchTransactionStatus;
  reset: () => void;
}