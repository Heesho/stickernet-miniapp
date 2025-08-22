"use client";

import { type ReactNode, useCallback, useMemo, useState, useEffect } from "react";
import { useAccount, useReadContract, useChainId, useSwitchChain } from "wagmi";
import dynamic from "next/dynamic";
import { ProfileView } from "./ProfileView";
import { ConnectedIdentity } from "../BaseAccount/ConnectedIdentity";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
  TransactionResponse,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import { useMiniKit, useAddFrame } from "@coinbase/onchainkit/minikit";
import { parseUnits, formatUnits, encodeFunctionData } from "viem";
import { baseSepolia } from "wagmi/chains";
import { Button, Card, Icon } from "../../ui";
import { USDC_ADDRESS, USDC_ABI, USDC_DECIMALS, TEST_USDC_MINT_AMOUNT } from "@/lib/constants";
import { useEnforceBaseWallet } from "../../../hooks/useBaseAccount";
import { getPaymasterActions } from "@/lib/paymaster";
import type { ProfileProps } from "./Profile.types";

// Create a client-only identity component to prevent hydration issues
const ClientOnlyIdentity = dynamic(
  () => import('../BaseAccount/ConnectedIdentity').then(mod => mod.ConnectedIdentity),
  { ssr: false }
);

export function Profile({ setActiveTab }: ProfileProps) {
  const { context } = useMiniKit();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [frameAdded, setFrameAdded] = useState(false);
  const addFrame = useAddFrame();
  const { switchChain } = useSwitchChain();
  
  // Enforce Base Smart Wallet connections only
  const { isBaseSmartWallet, shouldShowWarning, isValidConnection, connector } = useEnforceBaseWallet();
  
  // USDC balance query - keep this as it's a read operation
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const handleSwitchNetwork = useCallback(async () => {
    try {
      await switchChain({ chainId: baseSepolia.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          cause: error.cause
        });
      }
    }
  }, [switchChain, chainId]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="primary"
          size="md"
          onClick={handleAddFrame}
          className="w-full"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame to Account
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center justify-center space-x-2 text-sm font-medium text-[#0052FF] p-3 bg-[var(--app-accent-light)] rounded-lg">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Frame Saved to Account</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  return (
    <div className="animate-fade-in">
      {/* Profile View with Tabs */}
      <ProfileView />
      
      {/* Wallet Connection Section - Hidden for now, can be shown in settings */}
      <div className="hidden">
        {/* Base Smart Wallet Warning */}
        {shouldShowWarning && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon name="warning" size="sm" className="text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Base Smart Wallet Required
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                  This app requires a Base Smart Wallet for the best experience with gasless transactions.
                  Current connector: {connector}
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                  Please disconnect and connect with Base Wallet from the Coinbase app.
                </p>
              </div>
            </div>
          </div>
        )}


      {/* User Identity with Base Account - Clickable */}
      <div className="flex justify-start mb-6">
        <ClientOnlyIdentity />
      </div>

      {/* Additional Content for Connected Users */}
      {isConnected && (
        <div className="space-y-6">
          {saveFrameButton && (
            <div>
              {saveFrameButton}
            </div>
          )}

          {/* USDC Mint for Testing */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-[var(--app-foreground)]">Testing Tools</h4>
            
            {/* Network Check */}
            {chainId !== baseSepolia.id && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ Please switch to Base Sepolia testnet (Chain ID: {baseSepolia.id})
                </p>
                <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-1">
                  Currently on Chain ID: {chainId}
                </p>
                <Button
                  variant="outline"
                  onClick={handleSwitchNetwork}
                  className="w-full mt-2"
                >
                  Switch to Base Sepolia
                </Button>
              </div>
            )}
            
            {/* USDC Balance Display */}
            <div className="bg-[var(--app-accent-light)] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--app-foreground)]">USDC Balance:</span>
                <span className="text-sm font-bold text-[var(--app-foreground)]">
                  {chainId === baseSepolia.id && usdcBalance !== undefined 
                    ? `${Number(formatUnits(usdcBalance, USDC_DECIMALS)).toLocaleString()} USDC`
                    : chainId !== baseSepolia.id 
                    ? 'Wrong Network' 
                    : 'Loading...'
                  }
                </span>
              </div>
            </div>
            
            {/* USDC Mint Transaction - Only show if on correct network */}
            {chainId === baseSepolia.id && address && (
              <>
                <p className="text-sm text-[var(--app-foreground-muted)]">
                  Mint test USDC to use in the app ({TEST_USDC_MINT_AMOUNT} USDC)
                </p>
                <Transaction
                  calls={[{
                    to: USDC_ADDRESS,
                    data: encodeFunctionData({
                      abi: USDC_ABI,
                      functionName: 'mint',
                      args: [address, parseUnits(TEST_USDC_MINT_AMOUNT, USDC_DECIMALS)],
                    }),
                    value: BigInt(0),
                  }]}
                  capabilities={{
                    paymasterService: getPaymasterActions(),
                  }}
                  onSuccess={(response) => {
                    refetchBalance();
                    setTimeout(() => refetchBalance(), 2000);
                  }}
                  onError={(error) => {
                    console.error('USDC mint failed:', error);
                  }}
                >
                  <TransactionButton text="Mint USDC" className="w-full" />
                  <TransactionStatus>
                    <TransactionStatusAction />
                    <TransactionStatusLabel />
                  </TransactionStatus>
                  <TransactionToast>
                    <TransactionToastIcon />
                    <TransactionToastLabel />
                    <TransactionToastAction />
                  </TransactionToast>
                </Transaction>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}