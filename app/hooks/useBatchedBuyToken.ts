import { useAccount, useConfig } from 'wagmi';
import { useWriteContracts, useCallsStatus } from 'wagmi/experimental';
import { parseUnits, type Address, type Hex } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { useState, useCallback, useMemo } from 'react';
import { 
  USDC_ADDRESS, 
  USDC_ABI, 
  ROUTER_ADDRESS, 
  ROUTER_ABI,
  USDC_DECIMALS 
} from '@/lib/constants';

interface BuyTokenParams {
  tokenAddress: string;
  usdcAmount: string;
  minTokenAmountOut: bigint;
}

interface BuyTokenCallbacks {
  onSuccess?: (id: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for executing bundled approve + buy transaction using Smart Wallet batching
 * This provides a single transaction UX for token purchases
 */
export function useBatchedBuyToken() {
  const { address, connector } = useAccount();
  const config = useConfig();
  const [batchId, setBatchId] = useState<string>();

  // Use experimental writeContracts for batching
  const { 
    writeContracts,
    data: id,
    error: writeError,
    isPending: isWriting,
    reset
  } = useWriteContracts({
    mutation: {
      onError: (error) => {
        console.error('WriteContracts error:', error);
      }
    }
  });

  // Track batch transaction status
  const { 
    data: callsStatus,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: statusError
  } = useCallsStatus({
    id: batchId as `0x${string}`,
    query: {
      enabled: !!batchId,
      refetchInterval: (data) => {
        // Stop polling once confirmed
        return data?.status === 'CONFIRMED' ? false : 1000;
      }
    }
  });

  // Build the batch transaction calls
  const buildBatchCalls = useCallback(({
    tokenAddress,
    usdcAmount,
    minTokenAmountOut
  }: BuyTokenParams) => {
    // Parse USDC amount to 6 decimals
    const amountQuoteIn = parseUnits(usdcAmount, USDC_DECIMALS);
    
    // Set expiry to 20 minutes from now
    const expireTimestamp = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes
    
    console.log('Building batch calls with writeContracts:', {
      usdcAmount,
      amountQuoteIn: amountQuoteIn.toString(),
      minTokenAmountOut: minTokenAmountOut.toString(), // This is 18 decimals from buyQuoteIn
      expireTimestamp: new Date(Number(expireTimestamp) * 1000).toISOString(),
      tokenAddress
    });

    return [
      // 1. Approve USDC spending
      {
        address: USDC_ADDRESS as Address,
        abi: USDC_ABI,
        functionName: 'approve' as const,
        args: [ROUTER_ADDRESS as Address, amountQuoteIn] as readonly [Address, bigint]
        // Let the wallet estimate gas automatically
      },
      // 2. Buy tokens
      {
        address: ROUTER_ADDRESS as Address,
        abi: ROUTER_ABI,
        functionName: 'buy' as const,
        args: [
          tokenAddress as Address,
          '0x0000000000000000000000000000000000000000' as Address, // No affiliate
          amountQuoteIn,
          minTokenAmountOut,
          expireTimestamp
        ] as readonly [Address, Address, bigint, bigint, bigint]
        // Let the wallet estimate gas automatically
      }
    ] as const;
  }, []);

  // Execute the bundled transaction
  const executeBuy = useCallback(async (
    params: BuyTokenParams,
    callbacks?: BuyTokenCallbacks
  ) => {
    if (!address) {
      callbacks?.onError?.(new Error('Wallet not connected'));
      return;
    }

    try {
      reset(); // Clear previous state
      
      const calls = buildBatchCalls(params);
      
      // Execute batch transaction with proper chain config
      const result = await writeContracts({
        contracts: calls,
        chainId: baseSepolia.id,
        account: address as Address,
        capabilities: {
          // Enable atomic batch for Smart Wallet
          atomicBatch: {
            supported: true
          },
          // Add auxiliary funds capability for gas
          auxiliaryFunds: {
            supported: true
          }
        }
      });

      if (result) {
        setBatchId(result);
        callbacks?.onSuccess?.(result);
      }
    } catch (error) {
      console.error('Batch buy transaction failed:', error);
      callbacks?.onError?.(error as Error);
    }
  }, [address, buildBatchCalls, writeContracts, reset]);

  // Get user-friendly status
  const status = useMemo(() => {
    if (isWriting) return 'preparing';
    if (isConfirming) return 'confirming';
    if (isConfirmed) return 'success';
    if (writeError || statusError) return 'error';
    return 'idle';
  }, [isWriting, isConfirming, isConfirmed, writeError, statusError]);

  // Get transaction receipts if confirmed
  const receipts = callsStatus?.receipts;

  return {
    executeBuy,
    status,
    isLoading: isWriting || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || statusError,
    batchId: id,
    receipts,
    reset
  };
}

/**
 * Hook to check if user needs to approve USDC first
 * Useful for showing approval state in UI
 */
export function useNeedsApproval(amount: string) {
  const { address } = useAccount();
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkApproval = useCallback(async () => {
    if (!address || !amount || parseFloat(amount) <= 0) {
      setNeedsApproval(false);
      return;
    }

    setIsChecking(true);
    try {
      // TODO: Check current allowance
      // const allowance = await readContract({
      //   address: USDC_ADDRESS,
      //   abi: USDC_ABI,
      //   functionName: 'allowance',
      //   args: [address, ROUTER_ADDRESS]
      // });
      
      // const amountNeeded = parseUnits(amount, USDC_DECIMALS);
      // setNeedsApproval(allowance < amountNeeded);
    } catch (error) {
      console.error('Failed to check approval:', error);
    } finally {
      setIsChecking(false);
    }
  }, [address, amount]);

  return {
    needsApproval,
    isChecking,
    checkApproval
  };
}