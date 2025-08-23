import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, parseEventLogs } from 'viem';
import { ROUTER_ADDRESS, ROUTER_ABI, USDC_ADDRESS, USDC_ABI } from '@/lib/constants';
import { toast } from 'sonner';
import { useAsyncErrorHandler, type StandardError } from './useErrorHandler';

interface CreateTokenParams {
  name: string;
  symbol: string;
  uri: string;
  initialBuyAmount: string;
}

interface UseCreateTokenReturn {
  createToken: (params: CreateTokenParams) => Promise<{ hash: string }>;
  isCreating: boolean;
  error: StandardError | null;
  hasError: boolean;
}

export function useCreateToken(): UseCreateTokenReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isCreating, setIsCreating] = useState(false);
  
  const errorHandler = useAsyncErrorHandler({
    hookName: 'useCreateToken',
    showToast: false, // We'll handle toasts manually for better UX
    enableLogging: true,
    customErrorMapper: (error: unknown) => {
      // Map specific contract errors
      const errorObj = error as { message?: string };
      if (errorObj?.message?.includes('insufficient')) {
        return {
          category: 'contract' as const,
          severity: 'high' as const,
          userMessage: 'Insufficient funds for token creation',
          recoverySuggestion: 'Please ensure you have enough USDC and ETH for gas fees.',
          retryable: false
        };
      }
      
      if (errorObj?.message?.includes('approval')) {
        return {
          category: 'contract' as const,
          severity: 'medium' as const,
          userMessage: 'Token approval failed',
          recoverySuggestion: 'Please try the transaction again.',
          retryable: true
        };
      }
      
      return {};
    }
  });

  const createToken = async (params: CreateTokenParams) => {
    // Validate inputs
    if (!params.name?.trim()) {
      throw new Error('Token name is required');
    }
    if (!params.symbol?.trim()) {
      throw new Error('Token symbol is required');
    }
    if (!params.uri?.trim()) {
      throw new Error('Token URI is required');
    }
    
    const result = await errorHandler.executeWithErrorHandling(async () => {
      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      setIsCreating(true);

      const buyAmountInUsdc = parseUnits(params.initialBuyAmount || '0', 6);

      // Step 1: Approve USDC spending if there's an initial buy
      if (parseFloat(params.initialBuyAmount) > 0) {
        const approveHash = await walletClient.writeContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [
            ROUTER_ADDRESS,
            buyAmountInUsdc
          ],
          account: address,
          chain: walletClient.chain,
        });

        // Wait for approval confirmation
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });

        if (approveReceipt.status !== 'success') {
          throw new Error('USDC approval failed');
        }
      }

      // Step 2: Create token
      const createHash = await walletClient.writeContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'createToken',
        args: [
          params.name,
          params.symbol,
          params.uri,
          false, // isModerated - always false for now
          0n, // amountQuoteIn - 0 for now since we're not buying on creation
        ],
        account: address,
        chain: walletClient.chain,
      });

      // Wait for token creation confirmation
      const createReceipt = await publicClient.waitForTransactionReceipt({
        hash: createHash,
        confirmations: 1,
      });

      // Check if token creation was successful
      if (createReceipt.status === 'success') {
        // Parse the events to get the new token address
        const events = parseEventLogs({
          abi: ROUTER_ABI,
          logs: createReceipt.logs,
          eventName: 'Router__TokenCreated'
        });

        const tokenAddress = events[0]?.args?.token;
        
        if (!tokenAddress) {
          throw new Error('Failed to get token address from event');
        }

        // Step 3: Perform initial buy if there's an amount
        let buyHash = null;
        let buyReceipt = null;
        
        if (parseFloat(params.initialBuyAmount) > 0) {
          buyHash = await walletClient.writeContract({
            address: ROUTER_ADDRESS,
            abi: ROUTER_ABI,
            functionName: 'buy',
            args: [
              tokenAddress, // token address
              address, // affiliate (use self)
              buyAmountInUsdc, // amountQuoteIn
              0n, // minAmountTokenOut (0 for no slippage protection)
              BigInt(Math.floor(Date.now() / 1000) + 300), // expireTimestamp (5 minutes from now)
            ],
            account: address,
          });

          // Wait for buy confirmation
          buyReceipt = await publicClient.waitForTransactionReceipt({
            hash: buyHash,
            confirmations: 1,
          });

          if (buyReceipt.status !== 'success') {
            // Log but don't fail the entire process
            console.warn('Initial buy failed, but token was created successfully');
          }
        }

        const result = {
          success: true,
          hash: createHash,
          receipt: createReceipt,
          tokenAddress,
          buyHash,
          buyReceipt,
        };

        toast.success(`Token ${params.symbol} created successfully!`);
        return result;
      } else {
        throw new Error('Token creation transaction failed');
      }
    }, {
      operation: 'create_token',
      tokenName: params.name,
      tokenSymbol: params.symbol,
      initialBuyAmount: params.initialBuyAmount
    });

    setIsCreating(false);

    if (!result) {
      // Error was handled by errorHandler
      if (errorHandler.error) {
        toast.error(errorHandler.error.userMessage);
      }
      throw errorHandler.error || new Error('Token creation failed');
    }

    return result;
  };

  return {
    createToken,
    isCreating,
    error: errorHandler.error,
    hasError: errorHandler.hasError,
  };
}