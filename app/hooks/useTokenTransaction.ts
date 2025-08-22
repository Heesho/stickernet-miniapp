/**
 * Unified Token Transaction Hook
 * 
 * This hook consolidates all token transaction functionality (buy/sell) with support for
 * different transaction methods (standard, batched, sendCalls) and provides a consistent
 * interface for all token operations.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAccount, useWalletClient, useConfig, usePublicClient, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useWriteContracts, useCallsStatus } from 'wagmi/experimental';
import { parseUnits, encodeFunctionData, formatUnits, numberToHex, type Address, type Hex } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { 
  USDC_ADDRESS, 
  USDC_ABI, 
  ROUTER_ADDRESS, 
  ROUTER_ABI,
  USDC_DECIMALS 
} from '@/lib/constants';
import { TransactionReceipts } from '@/types/blockchain.types';

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

/**
 * Transaction operation type
 */
export type TransactionOperation = 'buy' | 'sell';

/**
 * Transaction method type
 */
export type TransactionMethod = 'standard' | 'batched' | 'sendCalls';

/**
 * Transaction status type
 */
export type TransactionStatus = 'idle' | 'preparing' | 'approving' | 'confirming' | 'success' | 'error';

/**
 * Parameters for buy operation
 */
export interface BuyTransactionParams {
  operation: 'buy';
  tokenAddress: string;
  usdcAmount: string;
  minTokenAmountOut: bigint;
}

/**
 * Parameters for sell operation
 */
export interface SellTransactionParams {
  operation: 'sell';
  tokenAddress: string;
  tokenAmount: string;
  minUsdcAmountOut: bigint;
}

/**
 * Union type for transaction parameters
 */
export type TransactionParams = BuyTransactionParams | SellTransactionParams;

/**
 * Transaction execution options
 */
export interface TransactionOptions {
  method?: TransactionMethod;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Internal transaction state
 */
interface TransactionState {
  approveStatus: 'idle' | 'pending' | 'success' | 'error';
  transactionStatus: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
  txHash?: string;
  batchId?: string;
}

/**
 * Hook return type
 */
export interface UseTokenTransactionReturn {
  executeTransaction: (params: TransactionParams, options?: TransactionOptions) => Promise<void>;
  status: TransactionStatus;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  txHash?: string;
  batchId?: string;
  receipts?: TransactionReceipts;
  needsApproval: (operation: TransactionOperation, amount: string, tokenAddress?: string) => boolean;
  reset: () => void;
}

/**
 * Unified token transaction hook
 * 
 * Supports both buy and sell operations with multiple transaction methods:
 * - standard: Separate approve and transaction calls (for EOA wallets)
 * - batched: Uses writeContracts for atomic batching (Smart Wallets)
 * - sendCalls: Uses wallet_sendCalls for native Smart Wallet batching
 * 
 * @returns Hook interface with transaction execution and state management
 */
export function useTokenTransaction(): UseTokenTransactionReturn {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: baseSepolia.id });

  // Internal state
  const [state, setState] = useState<TransactionState>({
    approveStatus: 'idle',
    transactionStatus: 'idle',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<TransactionMethod>('sendCalls');

  // Standard method hooks
  const {
    writeContract: writeStandard,
    data: standardHash,
    isPending: isStandardPending,
    error: standardError
  } = useWriteContract();

  const { isSuccess: isStandardSuccess } = useWaitForTransactionReceipt({
    hash: standardHash,
    chainId: baseSepolia.id,
  });

  // Batched method hooks
  const { 
    writeContracts,
    data: batchId,
    error: batchError,
    isPending: isBatchPending,
    reset: resetBatch
  } = useWriteContracts();

  const { 
    data: callsStatus,
    isLoading: isBatchConfirming,
    isSuccess: isBatchSuccess,
    error: batchStatusError
  } = useCallsStatus({
    id: state.batchId as `0x${string}`,
    query: {
      enabled: !!state.batchId && currentMethod === 'batched',
      refetchInterval: (data) => {
        return data?.status === 'CONFIRMED' ? false : 1000;
      }
    }
  });

  // Check current USDC allowance for buy operations
  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS as Address,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, ROUTER_ADDRESS as Address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!address
    }
  });

  /**
   * Check if approval is needed for a given operation
   */
  const needsApproval = useCallback((
    operation: TransactionOperation, 
    amount: string, 
    tokenAddress?: string
  ): boolean => {
    if (!address || !amount || parseFloat(amount) <= 0) return false;

    try {
      if (operation === 'buy') {
        if (!usdcAllowance) return true;
        const amountQuoteIn = parseUnits(amount, USDC_DECIMALS);
        return usdcAllowance < amountQuoteIn;
      } else {
        // For sell operations, we always need approval since we don't track token allowances
        return true;
      }
    } catch {
      return true;
    }
  }, [address, usdcAllowance]);

  /**
   * Check if wallet supports batch transactions
   */
  const checkBatchSupport = useCallback(async (): Promise<boolean> => {
    if (!walletClient || !address) return false;

    try {
      const capabilities = await walletClient.request({
        method: 'wallet_getCapabilities' as 'wallet_getCapabilities',
        params: [address]
      });

      const chainCapabilities = (capabilities as Record<string, unknown>)?.[baseSepolia.id];
      const atomicBatch = (chainCapabilities as { atomicBatch?: { supported?: boolean } })?.atomicBatch;
      return atomicBatch?.supported === true;
    } catch (error) {
      return true; // Assume supported if check fails (Smart Wallet should support it)
    }
  }, [walletClient, address]);

  /**
   * Build transaction calls for batching
   */
  const buildTransactionCalls = useCallback((params: TransactionParams) => {
    const expireTimestamp = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes

    if (params.operation === 'buy') {
      const amountQuoteIn = parseUnits(params.usdcAmount, USDC_DECIMALS);
      
      return [
        // 1. Approve USDC spending
        {
          address: USDC_ADDRESS as Address,
          abi: USDC_ABI,
          functionName: 'approve' as const,
          args: [ROUTER_ADDRESS as Address, amountQuoteIn] as readonly [Address, bigint],
          to: USDC_ADDRESS as Address,
          value: '0x0' as const,
          data: encodeFunctionData({
            abi: USDC_ABI,
            functionName: 'approve',
            args: [ROUTER_ADDRESS as Address, amountQuoteIn],
          })
        },
        // 2. Buy tokens
        {
          address: ROUTER_ADDRESS as Address,
          abi: ROUTER_ABI,
          functionName: 'buy' as const,
          args: [
            params.tokenAddress as Address,
            '0x0000000000000000000000000000000000000000' as Address, // No affiliate
            amountQuoteIn,
            params.minTokenAmountOut,
            expireTimestamp
          ] as readonly [Address, Address, bigint, bigint, bigint],
          to: ROUTER_ADDRESS as Address,
          value: '0x0' as const,
          data: encodeFunctionData({
            abi: ROUTER_ABI,
            functionName: 'buy',
            args: [
              params.tokenAddress as Address,
              '0x0000000000000000000000000000000000000000' as Address,
              amountQuoteIn,
              params.minTokenAmountOut,
              expireTimestamp
            ],
          })
        }
      ];
    } else {
      const amountTokenIn = parseUnits(params.tokenAmount, 18);
      
      return [
        // 1. Approve token spending
        {
          address: params.tokenAddress as Address,
          abi: TOKEN_ABI,
          functionName: 'approve' as const,
          args: [ROUTER_ADDRESS as Address, amountTokenIn] as readonly [Address, bigint],
          to: params.tokenAddress as Address,
          value: '0x0' as const,
          data: encodeFunctionData({
            abi: TOKEN_ABI,
            functionName: 'approve',
            args: [ROUTER_ADDRESS as Address, amountTokenIn],
          })
        },
        // 2. Sell tokens
        {
          address: ROUTER_ADDRESS as Address,
          abi: ROUTER_ABI,
          functionName: 'sell' as const,
          args: [
            params.tokenAddress as Address,
            '0x0000000000000000000000000000000000000000' as Address, // No affiliate
            amountTokenIn,
            params.minUsdcAmountOut,
            expireTimestamp
          ] as readonly [Address, Address, bigint, bigint, bigint],
          to: ROUTER_ADDRESS as Address,
          value: '0x0' as const,
          data: encodeFunctionData({
            abi: ROUTER_ABI,
            functionName: 'sell',
            args: [
              params.tokenAddress as Address,
              '0x0000000000000000000000000000000000000000' as Address,
              amountTokenIn,
              params.minUsdcAmountOut,
              expireTimestamp
            ],
          })
        }
      ];
    }
  }, []);

  /**
   * Execute transaction using standard method (separate approve + transaction)
   */
  const executeStandardTransaction = useCallback(async (
    params: TransactionParams,
    options?: TransactionOptions
  ) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const calls = buildTransactionCalls(params);
    const [approveCall, transactionCall] = calls;

    try {
      setState(prev => ({
        ...prev,
        approveStatus: 'pending',
        transactionStatus: 'idle'
      }));

      // Check if approval is needed
      const needsApprove = needsApproval(
        params.operation, 
        params.operation === 'buy' ? params.usdcAmount : params.tokenAmount,
        params.operation === 'sell' ? params.tokenAddress : undefined
      );

      if (needsApprove) {
        
        // Execute approval
        const approveHash = await writeStandard({
          address: approveCall.address,
          abi: approveCall.abi,
          functionName: approveCall.functionName,
          args: approveCall.args,
          chainId: baseSepolia.id,
        });

        // Wait for approval confirmation
        await publicClient?.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });

        setState(prev => ({
          ...prev,
          approveStatus: 'success'
        }));
      }

      setState(prev => ({
        ...prev,
        transactionStatus: 'pending'
      }));


      // Execute main transaction
      const txHash = await writeStandard({
        address: transactionCall.address,
        abi: transactionCall.abi,
        functionName: transactionCall.functionName,
        args: transactionCall.args,
        chainId: baseSepolia.id,
      });

      setState(prev => ({
        ...prev,
        transactionStatus: 'success',
        txHash
      }));

      options?.onSuccess?.(txHash);
    } catch (error) {
      console.error('Standard transaction failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({
        ...prev,
        approveStatus: 'error',
        transactionStatus: 'error',
        error: errorMessage
      }));
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [address, buildTransactionCalls, needsApproval, writeStandard, publicClient]);

  /**
   * Execute transaction using batched method (writeContracts)
   */
  const executeBatchedTransaction = useCallback(async (
    params: TransactionParams,
    options?: TransactionOptions
  ) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setState(prev => ({
        ...prev,
        approveStatus: 'pending',
        transactionStatus: 'pending'
      }));

      const calls = buildTransactionCalls(params);
      

      // Execute batch transaction with proper chain config
      const result = await writeContracts({
        contracts: calls.map(call => ({
          address: call.address,
          abi: call.abi,
          functionName: call.functionName,
          args: call.args
        })),
        chainId: baseSepolia.id,
        account: address as Address,
        capabilities: {
          atomicBatch: {
            supported: true
          },
          auxiliaryFunds: {
            supported: true
          }
        }
      });

      if (result) {
        setState(prev => ({
          ...prev,
          batchId: result,
          approveStatus: 'success',
          transactionStatus: 'success'
        }));
        options?.onSuccess?.(result);
      }
    } catch (error) {
      console.error('Batched transaction failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({
        ...prev,
        approveStatus: 'error',
        transactionStatus: 'error',
        error: errorMessage
      }));
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [address, buildTransactionCalls, writeContracts]);

  /**
   * Execute transaction using sendCalls method (wallet_sendCalls)
   */
  const executeSendCallsTransaction = useCallback(async (
    params: TransactionParams,
    options?: TransactionOptions
  ) => {
    if (!address) {
      throw new Error('Please connect your wallet');
    }

    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      setState(prev => ({
        ...prev,
        approveStatus: 'pending',
        transactionStatus: 'pending'
      }));

      const calls = buildTransactionCalls(params);
      

      // Check if batch transactions are supported
      const batchSupported = await checkBatchSupport();

      // Prepare batch calls for wallet_sendCalls
      const sendCallsData = calls.map(call => ({
        to: call.to,
        value: call.value,
        data: call.data,
      }));


      // Send batch transaction using wallet_sendCalls
      const result = await walletClient.request({
        method: 'wallet_sendCalls' as 'wallet_sendCalls',
        params: [{
          version: '2.0.0',
          from: address,
          chainId: numberToHex(baseSepolia.id),
          atomicRequired: true, // All calls must succeed or all fail
          calls: sendCallsData
        }]
      });


      // Update status to success immediately
      setState(prev => ({
        ...prev,
        approveStatus: 'success',
        transactionStatus: 'success',
        txHash: (result as { transactionHash?: string })?.transactionHash || String(result),
      }));

      options?.onSuccess?.((result as { transactionHash?: string })?.transactionHash || String(result));
    } catch (error: unknown) {
      console.error('SendCalls transaction failed:', error);
      
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

      setState(prev => ({
        ...prev,
        approveStatus: 'error',
        transactionStatus: 'error',
        error: errorMessage,
      }));
      
      options?.onError?.(new Error(errorMessage));
    }
  }, [address, walletClient, buildTransactionCalls, checkBatchSupport]);

  /**
   * Main transaction execution function
   */
  const executeTransaction = useCallback(async (
    params: TransactionParams,
    options: TransactionOptions = {}
  ) => {
    const method = options.method || 'sendCalls'; // Default to sendCalls for best UX
    setCurrentMethod(method);
    setIsLoading(true);

    try {
      // Reset state
      setState({
        approveStatus: 'idle',
        transactionStatus: 'idle',
      });

      switch (method) {
        case 'standard':
          await executeStandardTransaction(params, options);
          break;
        case 'batched':
          await executeBatchedTransaction(params, options);
          break;
        case 'sendCalls':
          await executeSendCallsTransaction(params, options);
          break;
        default:
          throw new Error(`Unsupported transaction method: ${method}`);
      }
    } catch (error) {
      console.error('Transaction execution failed:', error);
      options?.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  }, [executeStandardTransaction, executeBatchedTransaction, executeSendCallsTransaction]);

  /**
   * Reset transaction state
   */
  const reset = useCallback(() => {
    setState({
      approveStatus: 'idle',
      transactionStatus: 'idle',
    });
    setIsLoading(false);
    resetBatch?.();
  }, [resetBatch]);

  /**
   * Compute overall transaction status
   */
  const status: TransactionStatus = useMemo(() => {
    if (isLoading && state.approveStatus === 'idle' && state.transactionStatus === 'idle') {
      return 'preparing';
    }
    if (state.approveStatus === 'pending' && state.transactionStatus === 'idle') {
      return 'approving';
    }
    if (state.transactionStatus === 'pending' || isBatchConfirming) {
      return 'confirming';
    }
    if (state.approveStatus === 'success' && state.transactionStatus === 'success') {
      return 'success';
    }
    if (state.approveStatus === 'error' || state.transactionStatus === 'error') {
      return 'error';
    }
    return 'idle';
  }, [isLoading, state.approveStatus, state.transactionStatus, isBatchConfirming]);

  /**
   * Compute if transaction is successful
   */
  const isSuccess = useMemo(() => {
    if (currentMethod === 'batched') {
      return isBatchSuccess;
    }
    if (currentMethod === 'standard') {
      return isStandardSuccess;
    }
    return state.approveStatus === 'success' && state.transactionStatus === 'success';
  }, [currentMethod, isBatchSuccess, isStandardSuccess, state.approveStatus, state.transactionStatus]);

  /**
   * Compute error state
   */
  const error = useMemo(() => {
    if (state.error) {
      return new Error(state.error);
    }
    if (standardError) {
      return standardError;
    }
    if (batchError) {
      return batchError;
    }
    if (batchStatusError) {
      return batchStatusError;
    }
    return null;
  }, [state.error, standardError, batchError, batchStatusError]);

  /**
   * Compute loading state
   */
  const loading = useMemo(() => {
    return isLoading || isStandardPending || isBatchPending || isBatchConfirming;
  }, [isLoading, isStandardPending, isBatchPending, isBatchConfirming]);

  return {
    executeTransaction,
    status,
    isLoading: loading,
    isSuccess,
    error,
    txHash: state.txHash || standardHash,
    batchId: state.batchId || batchId,
    receipts: callsStatus?.receipts,
    needsApproval,
    reset
  };
}