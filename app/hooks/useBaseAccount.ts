import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import type { Address } from 'viem';

export interface BaseAccountInfo {
  isBaseSmartWallet: boolean;
  isConnected: boolean;
  address: Address | undefined;
  connector: string | undefined;
  chainId: number | undefined;
}

/**
 * Hook to detect and validate Base Smart Wallet connections
 * Ensures users are connecting with Base account abstraction
 */
export function useBaseAccount(): BaseAccountInfo {
  const { address, isConnected, chainId, connector } = useAccount();

  const isBaseSmartWallet = useMemo(() => {
    if (!isConnected || !connector) return false;
    
    // Check if it's a Coinbase Wallet connector
    const isCoinbaseWallet = connector.name?.toLowerCase().includes('coinbase');
    
    // Additional checks for Smart Wallet characteristics
    const hasSmartWalletFeatures = (
      connector.type === 'coinbaseWallet' || 
      connector.id === 'coinbaseWalletSDK'
    );
    
    return isCoinbaseWallet && hasSmartWalletFeatures;
  }, [connector, isConnected]);

  return {
    isBaseSmartWallet,
    isConnected,
    address,
    connector: connector?.name,
    chainId,
  };
}

/**
 * Hook to enforce Base Smart Wallet only connections
 * Returns connection status with enforcement
 */
export function useEnforceBaseWallet() {
  const accountInfo = useBaseAccount();
  
  const shouldShowWarning = accountInfo.isConnected && !accountInfo.isBaseSmartWallet;
  
  return {
    ...accountInfo,
    shouldShowWarning,
    isValidConnection: accountInfo.isConnected && accountInfo.isBaseSmartWallet,
  };
}