/**
 * Hook for handling sell token transactions with batch operations
 * Following the exact pattern from useSendCallsBuyToken which works correctly
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseUnits, encodeFunctionData, formatUnits, numberToHex, type Address } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { 
  ROUTER_ADDRESS, 
  ROUTER_ABI,
} from '@/lib/constants';

// Standard ERC20 ABI for approve function
const TOKEN_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

interface SellTokenParams {
  tokenAddress: string;
  tokenAmount: string;
  minUsdcAmountOut: bigint;
}

interface BatchTransactionStatus {
  approveStatus: 'idle' | 'pending' | 'success' | 'error';
  sellStatus: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
  txHash?: string;
}

/**
 * Hook for executing bundled approve + sell transaction
 * Uses the same pattern as buy - direct wallet_sendCalls without polling
 */
export function useSendCallsSellToken() {
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<BatchTransactionStatus>({
    approveStatus: 'idle',
    sellStatus: 'idle',
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
   * Execute batch sell transaction using wallet_sendCalls
   * This follows the EXACT pattern from buy - approve token then sell
   */
  const executeSell = useCallback(async (params: SellTokenParams) => {
    const { tokenAddress, tokenAmount, minUsdcAmountOut } = params;

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
        sellStatus: 'pending',
      });

      // Parse token amount to 18 decimals (standard for tokens)
      const amountTokenIn = parseUnits(tokenAmount, 18);
      
      // Set expiry to 20 minutes from now
      const expireTimestamp = BigInt(Math.floor(Date.now() / 1000) + 1200);

      console.log('Starting batch transaction:', {
        tokenAddress,
        tokenAmount,
        amountTokenIn: amountTokenIn.toString(),
        minUsdcAmountOut: minUsdcAmountOut.toString(),
        userAddress,
      });

      // Check if batch transactions are supported
      const batchSupported = await checkBatchSupport();
      console.log('Batch transactions supported:', batchSupported);

      // Encode the token approve call
      const approveCallData = encodeFunctionData({
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [ROUTER_ADDRESS as Address, amountTokenIn],
      });

      // Encode the router sell call
      const sellCallData = encodeFunctionData({
        abi: ROUTER_ABI,
        functionName: 'sell',
        args: [
          tokenAddress as Address,
          '0x0000000000000000000000000000000000000000' as Address, // No affiliate
          amountTokenIn,
          minUsdcAmountOut,
          expireTimestamp
        ],
      });

      // Prepare batch calls - approve token first, then sell
      const calls = [
        {
          to: tokenAddress as Address,
          value: '0x0',
          data: approveCallData,
        },
        {
          to: ROUTER_ADDRESS as Address,
          value: '0x0',
          data: sellCallData,
        }
      ];

      console.log('Executing batch calls:', calls);

      // Send batch transaction using wallet_sendCalls - EXACTLY like buy
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

      // Update status to success IMMEDIATELY - just like buy
      setStatus({
        approveStatus: 'success',
        sellStatus: 'success',
        txHash: (result as any)?.transactionHash || result,
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
        sellStatus: 'error',
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
      sellStatus: 'idle',
    });
    setIsLoading(false);
  }, []);

  // Return the same interface structure for compatibility
  return {
    executeSell,
    status: status.approveStatus === 'success' && status.sellStatus === 'success' ? 'success' : 
            status.approveStatus === 'pending' || status.sellStatus === 'pending' ? 'confirming' :
            status.approveStatus === 'error' || status.sellStatus === 'error' ? 'error' : 'idle',
    isLoading,
    isSuccess: status.approveStatus === 'success' && status.sellStatus === 'success',
    error: status.error ? new Error(status.error) : undefined,
    callsId: status.txHash,
    reset,
  };
}