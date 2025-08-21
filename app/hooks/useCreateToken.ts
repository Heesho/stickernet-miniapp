import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, parseEventLogs } from 'viem';
import { ROUTER_ADDRESS, ROUTER_ABI, USDC_ADDRESS, USDC_ABI } from '@/lib/constants';
import { toast } from 'sonner';

interface CreateTokenParams {
  name: string;
  symbol: string;
  uri: string;
  initialBuyAmount: string;
}

export function useCreateToken() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createToken = async (params: CreateTokenParams) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setIsCreating(true);
    setError(null);

    try {
      const buyAmountInUsdc = parseUnits(params.initialBuyAmount || '0', 6);

      // Step 1: Approve USDC spending if there's an initial buy
      if (parseFloat(params.initialBuyAmount) > 0) {
        console.log('Approving USDC spend:', buyAmountInUsdc.toString());
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
      console.log('Creating token with params:', params);
      const createHash = await walletClient.writeContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'createToken',
        args: [
          params.name,
          params.symbol,
          params.uri,
          false, // isModerated - always false for now
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
            console.warn('Initial buy failed, but token was created successfully');
          }
        }

        toast.success(`Token ${params.symbol} created successfully!`);
        
        return {
          success: true,
          hash: createHash,
          receipt: createReceipt,
          tokenAddress,
          buyHash,
          buyReceipt,
        };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err: any) {
      console.error('Error creating token:', err);
      const errorMessage = err.message || 'Failed to create token';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createToken,
    isCreating,
    error,
  };
}