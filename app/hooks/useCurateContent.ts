/**
 * Hook for handling content curation with true batch transactions
 * 
 * This hook uses EIP-5792 wallet_sendCalls to execute USDC approval
 * and router curateContent calls atomically in a single transaction.
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { encodeFunctionData, numberToHex } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { 
  USDC_CONTRACT, 
  ROUTER_CONTRACT, 
  USDC_DECIMALS 
} from '@/lib/constants';
import { useAsyncErrorHandler, type StandardError } from './useErrorHandler';
import type { 
  CurateContentParams, 
  BatchTransactionStatus, 
  UseCurateContentReturn 
} from '../../types/router.types';

/**
 * Custom hook for curating content with true batch transactions
 */
export function useCurateContent(): UseCurateContentReturn {
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<BatchTransactionStatus>({
    approveStatus: 'idle',
    curateStatus: 'idle',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const errorHandler = useAsyncErrorHandler({
    hookName: 'useCurateContent',
    showToast: false, // We'll handle toasts manually
    enableLogging: true,
    customErrorMapper: (error: unknown) => {
      // Map specific batch transaction errors
      const errorObj = error as { code?: number; message?: string };
      if (errorObj.code === 4001) {
        return {
          category: 'wallet' as const,
          severity: 'low' as const,
          userMessage: 'Transaction cancelled by user',
          recoverySuggestion: 'Please try again when ready.',
          retryable: true
        };
      }
      
      if (errorObj.code === 5740) {
        return {
          category: 'wallet' as const,
          severity: 'medium' as const,
          userMessage: 'Batch transaction too large',
          recoverySuggestion: 'Please try with a smaller transaction.',
          retryable: false
        };
      }
      
      return {};
    }
  });

  /**
   * Check if wallet supports batch transactions
   */
  const checkBatchSupport = useCallback(async () => {
    if (!walletClient || !userAddress) return false;

    try {
      const capabilities = await walletClient.request({
        method: 'wallet_getCapabilities' as 'wallet_getCapabilities',
        params: [userAddress]
      });

      const chainCapabilities = (capabilities as Record<string, unknown>)?.[baseSepolia.id];
      const atomicBatch = (chainCapabilities as { atomicBatch?: { supported?: boolean } })?.atomicBatch;
      return atomicBatch?.supported === true;
    } catch (error) {
      return true; // Assume supported if check fails (Smart Wallet should support it)
    }
  }, [walletClient, userAddress]);

  /**
   * Execute batch curate transaction using wallet_sendCalls
   */
  const curate = useCallback(async (params: CurateContentParams) => {
    const { tokenAddress, tokenId, nextPrice } = params;

    if (!userAddress) {
      errorHandler.handleError(new Error('Wallet not connected'), {
        context: 'wallet_check'
      });
      return;
    }

    if (!walletClient) {
      errorHandler.handleError(new Error('Wallet client not available'), {
        context: 'wallet_client_check'
      });
      return;
    }

    const result = await errorHandler.executeWithErrorHandling(async () => {
      setIsLoading(true);
      setStatus({
        approveStatus: 'pending',
        curateStatus: 'pending',
      });

      console.log('Curate transaction details:', {
        tokenAddress,
        tokenId: tokenId.toString(),
        nextPrice: nextPrice.toString(),
        userAddress,
      });

      // Check if batch transactions are supported
      const batchSupported = await checkBatchSupport();

      // Encode the USDC approve call
      const approveCallData = encodeFunctionData({
        abi: USDC_CONTRACT.abi,
        functionName: 'approve',
        args: [ROUTER_CONTRACT.address, nextPrice],
      });

      // Encode the router curateContent call
      const curateCallData = encodeFunctionData({
        abi: ROUTER_CONTRACT.abi,
        functionName: 'curateContent',
        args: [tokenAddress, tokenId],
      });

      // Prepare batch calls
      const calls = [
        {
          to: USDC_CONTRACT.address,
          value: '0x0',
          data: approveCallData,
        },
        {
          to: ROUTER_CONTRACT.address,
          value: '0x0', 
          data: curateCallData,
        }
      ];


      // Send batch transaction using wallet_sendCalls
      const result = await walletClient.request({
        method: 'wallet_sendCalls' as 'wallet_sendCalls',
        params: [{
          version: '2.0.0',
          from: userAddress,
          chainId: numberToHex(baseSepolia.id),
          atomicRequired: true, // All calls must succeed or all fail
          calls: calls
        }]
      });


      // Update status to success
      setStatus({
        approveStatus: 'success',
        curateStatus: 'success',
        approveHash: (result as { transactionHash?: string })?.transactionHash || String(result),
        curateHash: (result as { transactionHash?: string })?.transactionHash || String(result),
      });

      return result;
    }, {
      operation: 'curate_content',
      tokenAddress,
      tokenId: tokenId.toString(),
      nextPrice: nextPrice.toString()
    });

    setIsLoading(false);

    if (!result) {
      // Error was handled by errorHandler
      setStatus({
        approveStatus: 'error',
        curateStatus: 'error',
        error: errorHandler.error?.userMessage || 'Curation failed',
      });
    }
  }, [walletClient, userAddress, checkBatchSupport, errorHandler]);

  /**
   * Reset transaction state
   */
  const reset = useCallback(() => {
    setStatus({
      approveStatus: 'idle',
      curateStatus: 'idle',
    });
    setIsLoading(false);
  }, []);

  return {
    curate,
    isLoading,
    status,
    reset,
  };
}