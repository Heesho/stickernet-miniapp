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

  /**
   * Check if wallet supports batch transactions
   */
  const checkBatchSupport = useCallback(async () => {
    if (!walletClient || !userAddress) return false;

    try {
      const capabilities = await walletClient.request({
        method: 'wallet_getCapabilities' as any,
        params: [userAddress]
      });

      const chainCapabilities = (capabilities as any)?.[baseSepolia.id];
      return chainCapabilities?.atomicBatch?.supported === true;
    } catch (error) {
      console.log('Batch capabilities check failed, assuming supported:', error);
      return true; // Assume supported if check fails (Smart Wallet should support it)
    }
  }, [walletClient, userAddress]);

  /**
   * Execute batch curate transaction using wallet_sendCalls
   */
  const curate = useCallback(async (params: CurateContentParams) => {
    const { tokenAddress, tokenId, nextPrice } = params;

    if (!userAddress) {
      setStatus(prev => ({
        ...prev,
        error: 'Please connect your wallet',
      }));
      return;
    }

    if (!walletClient) {
      setStatus(prev => ({
        ...prev,
        error: 'Wallet not connected',
      }));
      return;
    }

    try {
      setIsLoading(true);
      setStatus({
        approveStatus: 'pending',
        curateStatus: 'pending',
      });

      console.log('Starting batch transaction:', {
        tokenAddress,
        tokenId: tokenId.toString(),
        nextPrice: nextPrice.toString(),
        userAddress,
      });

      // Check if batch transactions are supported
      const batchSupported = await checkBatchSupport();
      console.log('Batch transactions supported:', batchSupported);

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

      console.log('Executing batch calls:', calls);

      // Send batch transaction using wallet_sendCalls
      const result = await walletClient.request({
        method: 'wallet_sendCalls' as any,
        params: [{
          version: '2.0.0',
          from: userAddress,
          chainId: numberToHex(baseSepolia.id),
          atomicRequired: true, // All calls must succeed or all fail
          calls: calls
        }]
      });

      console.log('Batch transaction sent:', result);

      // Update status to success
      setStatus({
        approveStatus: 'success',
        curateStatus: 'success',
        approveHash: (result as any)?.transactionHash || result,
        curateHash: (result as any)?.transactionHash || result,
      });

    } catch (error: any) {
      console.error('Batch transaction failed:', error);
      
      let errorMessage = 'Batch transaction failed';
      
      if (error.code === 4001) {
        errorMessage = 'User rejected the transaction';
      } else if (error.code === 5740) {
        errorMessage = 'Batch too large for wallet to process';
      } else if (error.code === -32602) {
        errorMessage = 'Invalid request format';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setStatus({
        approveStatus: 'error',
        curateStatus: 'error',
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, userAddress, checkBatchSupport]);

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