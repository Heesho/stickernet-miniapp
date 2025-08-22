/**
 * Enhanced Transaction Hook with Loading State Management
 * 
 * Provides comprehensive transaction handling with loading states,
 * progress tracking, and user feedback for blockchain operations.
 */

import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import type { Address, Hash } from 'viem';
import { useLoadingState } from './useLoadingState';
import { useErrorHandler } from './useErrorHandler';
import { toast } from 'sonner';

/**
 * Transaction stages
 */
export type TransactionStage = 
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'pending'
  | 'confirming'
  | 'confirmed'
  | 'failed'
  | 'reverted';

/**
 * Transaction types for better categorization
 */
export type TransactionType = 
  | 'approve'
  | 'transfer'
  | 'swap'
  | 'mint'
  | 'burn'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'create'
  | 'update'
  | 'custom';

/**
 * Transaction configuration
 */
export interface TransactionConfig {
  /** Contract address */
  address: Address;
  /** Contract ABI */
  abi: any;
  /** Function name */
  functionName: string;
  /** Function arguments */
  args?: readonly unknown[];
  /** Transaction value (ETH amount) */
  value?: bigint;
  /** Gas limit override */
  gas?: bigint;
  /** Gas price override */
  gasPrice?: bigint;
  /** Transaction type for categorization */
  type?: TransactionType;
  /** Human-readable description */
  description?: string;
  /** Whether to show global loading */
  showGlobalLoading?: boolean;
  /** Success message */
  successMessage?: string;
  /** Error message override */
  errorMessage?: string;
  /** Whether to auto-retry on failure */
  autoRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Callback after success */
  onSuccess?: (receipt: any) => void;
  /** Callback after error */
  onError?: (error: any) => void;
}

/**
 * Transaction state
 */
export interface TransactionState {
  /** Current transaction stage */
  stage: TransactionStage;
  /** Transaction hash */
  hash: Hash | null;
  /** Transaction receipt */
  receipt: any;
  /** Current progress (0-100) */
  progress: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining: number | null;
  /** Gas used */
  gasUsed: bigint | null;
  /** Effective gas price */
  gasPrice: bigint | null;
  /** Block number */
  blockNumber: bigint | null;
  /** Confirmations received */
  confirmations: number;
  /** Required confirmations */
  requiredConfirmations: number;
  /** Retry count */
  retryCount: number;
}

/**
 * Transaction hook return type
 */
export interface UseTransactionReturn {
  /** Transaction state */
  state: TransactionState;
  
  /** Loading states */
  isLoading: boolean;
  isPreparing: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  isFailed: boolean;
  
  /** Error handling */
  error: any;
  hasError: boolean;
  canRetry: boolean;
  
  /** Actions */
  execute: (config: TransactionConfig) => Promise<Hash | null>;
  retry: () => Promise<Hash | null>;
  reset: () => void;
  cancel: () => void;
  
  /** Helpers */
  getStageMessage: () => string;
  getProgressMessage: () => string;
  formatGasCost: () => string;
}

/**
 * Stage messages for user feedback
 */
const STAGE_MESSAGES: Record<TransactionStage, string> = {
  idle: 'Ready to submit transaction',
  preparing: 'Preparing transaction...',
  signing: 'Please sign the transaction in your wallet',
  pending: 'Transaction submitted, waiting for confirmation...',
  confirming: 'Confirming transaction...',
  confirmed: 'Transaction confirmed successfully!',
  failed: 'Transaction failed',
  reverted: 'Transaction was reverted'
};

/**
 * Progress mapping for different stages
 */
const STAGE_PROGRESS: Record<TransactionStage, number> = {
  idle: 0,
  preparing: 10,
  signing: 25,
  pending: 50,
  confirming: 75,
  confirmed: 100,
  failed: 0,
  reverted: 0
};

/**
 * Enhanced transaction hook
 */
export function useTransactionWithLoading(): UseTransactionReturn {
  // State
  const [currentConfig, setCurrentConfig] = useState<TransactionConfig | null>(null);
  const [transactionState, setTransactionState] = useState<TransactionState>({
    stage: 'idle',
    hash: null,
    receipt: null,
    progress: 0,
    estimatedTimeRemaining: null,
    gasUsed: null,
    gasPrice: null,
    blockNumber: null,
    confirmations: 0,
    requiredConfirmations: 1,
    retryCount: 0
  });

  // Loading state management
  const loadingState = useLoadingState({
    hookName: 'useTransactionWithLoading',
    showGlobal: false, // Will be controlled per transaction
    autoClearStates: false, // Manual control for transactions
    minLoadingDuration: 0 // Immediate feedback for transactions
  });

  // Error handling
  const errorHandler = useErrorHandler({
    hookName: 'useTransactionWithLoading',
    showToast: true,
    customErrorMapper: (error) => {
      const errorObj = error as { message?: string; code?: string | number };
      
      // User rejected transaction
      if (errorObj?.code === 4001 || errorObj?.message?.includes('rejected')) {
        return {
          category: 'wallet' as const,
          severity: 'low' as const,
          userMessage: 'Transaction was cancelled',
          recoverySuggestion: 'Please try again when ready.',
          retryable: true
        };
      }
      
      // Insufficient funds
      if (errorObj?.message?.includes('insufficient')) {
        return {
          category: 'wallet' as const,
          severity: 'high' as const,
          userMessage: 'Insufficient funds for transaction',
          recoverySuggestion: 'Please ensure you have enough funds and try again.',
          retryable: false
        };
      }
      
      // Network errors
      if (errorObj?.message?.includes('network') || errorObj?.message?.includes('RPC')) {
        return {
          category: 'network' as const,
          severity: 'medium' as const,
          userMessage: 'Network connection issue',
          recoverySuggestion: 'Please check your connection and try again.',
          retryable: true
        };
      }
      
      return {
        category: 'contract' as const,
        severity: 'high' as const,
        userMessage: 'Transaction failed',
        recoverySuggestion: 'Please check the transaction details and try again.',
        retryable: true
      };
    }
  });

  // Wagmi hooks
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Transaction receipt waiting
  const [pendingHash, setPendingHash] = useState<Hash | null>(null);
  const { 
    data: receipt, 
    isLoading: isWaitingForReceipt, 
    isError: isReceiptError,
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash: pendingHash as Hash,
    confirmations: transactionState.requiredConfirmations,
  });

  // Update stage helper
  const updateStage = useCallback((stage: TransactionStage, updates?: Partial<TransactionState>) => {
    setTransactionState(prev => ({
      ...prev,
      stage,
      progress: STAGE_PROGRESS[stage],
      ...updates
    }));
  }, []);

  // Execute transaction
  const execute = useCallback(async (config: TransactionConfig): Promise<Hash | null> => {
    try {
      setCurrentConfig(config);
      errorHandler.clearError();
      
      // Start loading operation
      const operationId = loadingState.startLoading({
        type: 'transaction',
        message: config.description || `Processing ${config.type || 'transaction'}...`,
        priority: 'high',
        showGlobally: config.showGlobalLoading || false,
        cancellable: true,
        metadata: { 
          transactionType: config.type,
          stage: 'preparing' 
        }
      });

      // Stage 1: Preparing
      updateStage('preparing');
      loadingState.updateProgress(operationId, 10);

      // Stage 2: Signing
      updateStage('signing');
      loadingState.updateProgress(operationId, 25);

      // Execute the contract write
      const hash = await writeContractAsync({
        address: config.address,
        abi: config.abi,
        functionName: config.functionName,
        args: config.args,
        value: config.value,
        gas: config.gas,
        gasPrice: config.gasPrice
      });

      // Stage 3: Pending
      updateStage('pending', { hash });
      setPendingHash(hash);
      loadingState.updateProgress(operationId, 50);

      // Show success toast for submission
      toast.success('Transaction submitted!', {
        description: `Transaction hash: ${hash.slice(0, 10)}...`,
        duration: 3000
      });

      return hash;

    } catch (error) {
      updateStage('failed');
      errorHandler.handleError(error, {
        transactionConfig: config,
        stage: transactionState.stage
      });
      
      // Show error toast
      const errorMessage = config.errorMessage || 'Transaction failed';
      toast.error(errorMessage, {
        description: errorHandler.getRecoverySuggestion(),
        duration: 5000
      });

      return null;
    }
  }, [
    writeContractAsync, 
    updateStage, 
    loadingState, 
    errorHandler, 
    transactionState.stage
  ]);

  // Handle receipt updates
  useEffect(() => {
    if (receipt && transactionState.stage === 'pending') {
      updateStage('confirming', {
        receipt,
        gasUsed: receipt.gasUsed,
        gasPrice: receipt.effectiveGasPrice,
        blockNumber: receipt.blockNumber,
        confirmations: 1
      });

      // Complete the loading operation
      const operations = loadingState.activeOperations.filter(
        op => op.metadata?.stage === 'preparing' || op.type === 'transaction'
      );
      
      operations.forEach(op => {
        loadingState.updateProgress(op.id, 100);
        loadingState.completeOperation(op.id, receipt);
      });

      // Final confirmation
      setTimeout(() => {
        updateStage('confirmed');
        
        if (currentConfig?.onSuccess) {
          currentConfig.onSuccess(receipt);
        }

        // Show success message
        const successMessage = currentConfig?.successMessage || 'Transaction confirmed!';
        toast.success(successMessage, {
          description: `Block: ${receipt.blockNumber}`,
          duration: 5000
        });
      }, 1000);
    }
  }, [receipt, transactionState.stage, updateStage, loadingState, currentConfig]);

  // Handle receipt errors
  useEffect(() => {
    if (isReceiptError && receiptError) {
      updateStage('reverted');
      errorHandler.handleError(receiptError, {
        hash: pendingHash,
        stage: 'confirming'
      });

      if (currentConfig?.onError) {
        currentConfig.onError(receiptError);
      }
    }
  }, [isReceiptError, receiptError, updateStage, errorHandler, pendingHash, currentConfig]);

  // Progress tracking for confirmation stage
  useEffect(() => {
    if (transactionState.stage === 'confirming' && isWaitingForReceipt) {
      const interval = setInterval(() => {
        const operations = loadingState.activeOperations.filter(
          op => op.type === 'transaction'
        );
        
        operations.forEach(op => {
          const currentProgress = op.progress || 75;
          const newProgress = Math.min(95, currentProgress + 1);
          loadingState.updateProgress(op.id, newProgress);
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [transactionState.stage, isWaitingForReceipt, loadingState]);

  // Retry function
  const retry = useCallback(async (): Promise<Hash | null> => {
    if (!currentConfig) return null;
    
    const maxRetries = currentConfig.maxRetries || 3;
    if (transactionState.retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached');
      return null;
    }

    setTransactionState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1
    }));

    return execute(currentConfig);
  }, [currentConfig, transactionState.retryCount, execute]);

  // Reset function
  const reset = useCallback(() => {
    setTransactionState({
      stage: 'idle',
      hash: null,
      receipt: null,
      progress: 0,
      estimatedTimeRemaining: null,
      gasUsed: null,
      gasPrice: null,
      blockNumber: null,
      confirmations: 0,
      requiredConfirmations: 1,
      retryCount: 0
    });
    setPendingHash(null);
    setCurrentConfig(null);
    errorHandler.clearError();
    loadingState.clearAll();
  }, [errorHandler, loadingState]);

  // Cancel function
  const cancel = useCallback(() => {
    loadingState.clearAll();
    if (transactionState.stage === 'preparing' || transactionState.stage === 'signing') {
      reset();
    }
  }, [loadingState, transactionState.stage, reset]);

  // Helper functions
  const getStageMessage = useCallback((): string => {
    return STAGE_MESSAGES[transactionState.stage];
  }, [transactionState.stage]);

  const getProgressMessage = useCallback((): string => {
    switch (transactionState.stage) {
      case 'confirming':
        return `Confirming... (${transactionState.confirmations}/${transactionState.requiredConfirmations})`;
      case 'pending':
        return transactionState.hash ? `Pending: ${transactionState.hash.slice(0, 10)}...` : 'Pending...';
      default:
        return getStageMessage();
    }
  }, [transactionState, getStageMessage]);

  const formatGasCost = useCallback((): string => {
    if (!transactionState.gasUsed || !transactionState.gasPrice) {
      return 'Gas cost: calculating...';
    }
    
    const totalCost = transactionState.gasUsed * transactionState.gasPrice;
    const ethCost = Number(totalCost) / 1e18;
    return `Gas cost: ${ethCost.toFixed(6)} ETH`;
  }, [transactionState.gasUsed, transactionState.gasPrice]);

  // Derived state
  const isLoading = loadingState.isLoading || 
                   ['preparing', 'signing', 'pending', 'confirming'].includes(transactionState.stage);
  const isPreparing = transactionState.stage === 'preparing';
  const isPending = transactionState.stage === 'pending';
  const isConfirming = transactionState.stage === 'confirming';
  const isConfirmed = transactionState.stage === 'confirmed';
  const isFailed = ['failed', 'reverted'].includes(transactionState.stage);

  return {
    state: transactionState,
    
    // Loading states
    isLoading,
    isPreparing,
    isPending,
    isConfirming,
    isConfirmed,
    isFailed,
    
    // Error handling
    error: errorHandler.error,
    hasError: errorHandler.hasError,
    canRetry: errorHandler.canRetry && !isLoading,
    
    // Actions
    execute,
    retry,
    reset,
    cancel,
    
    // Helpers
    getStageMessage,
    getProgressMessage,
    formatGasCost
  };
}

/**
 * Simplified transaction hook for basic use cases
 */
export function useSimpleTransaction() {
  const transaction = useTransactionWithLoading();
  
  return {
    ...transaction,
    executeSimple: (config: Omit<TransactionConfig, 'showGlobalLoading'>) =>
      transaction.execute({ ...config, showGlobalLoading: false })
  };
}