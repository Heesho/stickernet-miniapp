import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
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

/**
 * Simplified hook for buying tokens
 * Handles approve and buy as separate transactions if needed
 */
export function useSimpleBuyToken() {
  const { address } = useAccount();
  const [status, setStatus] = useState<'idle' | 'approving' | 'buying' | 'success' | 'error'>('idle');
  const [error, setError] = useState<Error | null>(null);

  // Check current USDC allowance
  const { data: currentAllowance } = useReadContract({
    address: USDC_ADDRESS as Address,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, ROUTER_ADDRESS as Address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!address
    }
  });

  // Approve USDC spending
  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApproving,
    error: approveError
  } = useWriteContract();

  // Buy tokens
  const {
    writeContract: buy,
    data: buyHash,
    isPending: isBuying,
    error: buyError
  } = useWriteContract();

  // Wait for approve transaction
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
    chainId: baseSepolia.id,
  });

  // Wait for buy transaction
  const { isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash,
    chainId: baseSepolia.id,
  });

  const executeBuy = useCallback(async ({
    tokenAddress,
    usdcAmount,
    minTokenAmountOut
  }: BuyTokenParams) => {
    if (!address) {
      setError(new Error('Wallet not connected'));
      return;
    }

    try {
      setStatus('approving');
      setError(null);

      // Parse USDC amount
      const amountQuoteIn = parseUnits(usdcAmount, USDC_DECIMALS);
      
      // Check if approval is needed
      const needsApproval = !currentAllowance || currentAllowance < amountQuoteIn;

      if (needsApproval) {
        console.log('Approving USDC spend...');
        
        // Execute approval
        await approve({
          address: USDC_ADDRESS as Address,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [ROUTER_ADDRESS as Address, amountQuoteIn],
          chainId: baseSepolia.id,
        });

        // Wait for approval to be confirmed
        // This will be handled by the useWaitForTransactionReceipt hook
        console.log('Waiting for approval confirmation...');
        
        // Add a small delay to ensure approval is processed
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setStatus('buying');
      console.log('Executing buy transaction...');

      // Set expiry to 20 minutes from now
      const expireTimestamp = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes

      // Execute buy
      await buy({
        address: ROUTER_ADDRESS as Address,
        abi: ROUTER_ABI,
        functionName: 'buy',
        args: [
          tokenAddress as Address,
          '0x0000000000000000000000000000000000000000' as Address, // No affiliate
          amountQuoteIn,
          minTokenAmountOut,
          expireTimestamp
        ],
        chainId: baseSepolia.id,
      });

      setStatus('success');
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err as Error);
      setStatus('error');
    }
  }, [address, approve, buy, currentAllowance]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    executeBuy,
    status,
    isLoading: isApproving || isBuying || status === 'approving' || status === 'buying',
    isSuccess: isBuySuccess || status === 'success',
    error: error || approveError || buyError,
    approveHash,
    buyHash,
    needsApproval: (amount: string) => {
      if (!currentAllowance) return true;
      try {
        const amountQuoteIn = parseUnits(amount, USDC_DECIMALS);
        return currentAllowance < amountQuoteIn;
      } catch {
        return true;
      }
    },
    reset
  };
}