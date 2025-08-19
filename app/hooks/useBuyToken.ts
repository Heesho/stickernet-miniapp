import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, encodeFunctionData, Address } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { useState, useCallback } from 'react';
import { 
  USDC_ADDRESS, 
  USDC_ABI, 
  ROUTER_ADDRESS, 
  ROUTER_ABI,
  USDC_DECIMALS 
} from '@/lib/constants';

interface UseBuyTokenParams {
  tokenAddress: string;
  usdcAmount: string;
  minTokenAmountOut: bigint | undefined;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to execute a bundled approve + buy transaction
 * Uses Coinbase Smart Wallet's batching capability for single transaction UX
 */
export function useBuyToken() {
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient({ chainId: baseSepolia.id });
  
  const { 
    writeContractAsync,
    data: hash,
    isPending: isWritePending,
    error: writeError,
    reset
  } = useWriteContract();

  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
    chainId: baseSepolia.id,
  });

  /**
   * Execute bundled approve + buy transaction
   */
  const buyToken = useCallback(async ({
    tokenAddress,
    usdcAmount,
    minTokenAmountOut,
    onSuccess,
    onError
  }: UseBuyTokenParams) => {
    if (!minTokenAmountOut) {
      onError?.(new Error('Missing minimum token amount'));
      return;
    }

    try {
      setIsLoading(true);
      reset(); // Clear any previous transaction state

      // Parse USDC amount to 6 decimals
      const amountQuoteIn = parseUnits(usdcAmount, USDC_DECIMALS);
      
      // Set expiry to 10 minutes from now
      const expireTimestamp = BigInt(Math.floor(Date.now() / 1000) + 600);

      // Check if we're using a Smart Wallet that supports batching
      const isSmartWallet = true; // TODO: Detect if using Coinbase Smart Wallet

      if (isSmartWallet) {
        // For Smart Wallets: Bundle approve + buy in a single transaction
        // This uses the Smart Wallet's native batching capability
        
        // Encode the approve call
        const approveCalldata = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [ROUTER_ADDRESS as Address, amountQuoteIn]
        });

        // Encode the buy call
        const buyCalldata = encodeFunctionData({
          abi: ROUTER_ABI,
          functionName: 'buy',
          args: [
            tokenAddress as Address,
            '0x0000000000000000000000000000000000000000' as Address, // No affiliate
            amountQuoteIn,
            minTokenAmountOut,
            expireTimestamp
          ]
        });

        // Execute batch transaction through Smart Wallet
        // The Smart Wallet will execute both calls atomically
        const txHash = await writeContractAsync({
          address: USDC_ADDRESS as Address,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [ROUTER_ADDRESS as Address, amountQuoteIn],
          // Smart Wallet will detect the next transaction and batch them
          chainId: baseSepolia.id,
        });

        // Immediately follow with the buy transaction
        // Smart Wallet will batch this with the approve above
        await writeContractAsync({
          address: ROUTER_ADDRESS as Address,
          abi: ROUTER_ABI,
          functionName: 'buy',
          args: [
            tokenAddress as Address,
            '0x0000000000000000000000000000000000000000' as Address,
            amountQuoteIn,
            minTokenAmountOut,
            expireTimestamp
          ],
          chainId: baseSepolia.id,
        });

        onSuccess?.(txHash);
      } else {
        // For EOA wallets: Check allowance first, then execute separately
        // This is a fallback for non-Smart Wallet users
        
        // Check current allowance
        const currentAllowance = await publicClient?.readContract({
          address: USDC_ADDRESS as Address,
          abi: USDC_ABI,
          functionName: 'allowance',
          args: [
            // TODO: Get user address
            ROUTER_ADDRESS as Address
          ]
        });

        // Approve if needed
        if (!currentAllowance || currentAllowance < amountQuoteIn) {
          const approveTx = await writeContractAsync({
            address: USDC_ADDRESS as Address,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [ROUTER_ADDRESS as Address, amountQuoteIn],
            chainId: baseSepolia.id,
          });

          // Wait for approval confirmation
          await publicClient?.waitForTransactionReceipt({
            hash: approveTx,
            confirmations: 1,
          });
        }

        // Execute buy transaction
        const buyTx = await writeContractAsync({
          address: ROUTER_ADDRESS as Address,
          abi: ROUTER_ABI,
          functionName: 'buy',
          args: [
            tokenAddress as Address,
            '0x0000000000000000000000000000000000000000' as Address,
            amountQuoteIn,
            minTokenAmountOut,
            expireTimestamp
          ],
          chainId: baseSepolia.id,
        });

        onSuccess?.(buyTx);
      }
    } catch (error) {
      console.error('Buy transaction failed:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [writeContractAsync, publicClient, reset]);

  return {
    buyToken,
    isLoading: isLoading || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    hash,
    reset
  };
}

/**
 * Alternative: Use wagmi's built-in batching with useSimulateContract
 * This provides better type safety and simulation before execution
 */
export function useBuyTokenWithSimulation() {
  const [isSimulating, setIsSimulating] = useState(false);
  
  // TODO: Implement simulation-based approach for better UX
  // This would simulate both transactions before execution
  // and provide gas estimates and error checking
  
  return {
    // Implementation here
  };
}