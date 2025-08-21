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
    
    // Check if it's a Coinbase Wallet connector (various possible names)
    const connectorName = connector.name?.toLowerCase() || '';
    const connectorId = connector.id?.toLowerCase() || '';
    const connectorType = connector.type?.toLowerCase() || '';
    
    const isCoinbaseWallet = (
      connectorName.includes('coinbase') ||
      connectorName.includes('smart wallet') ||
      connectorName.includes('minikit') ||
      connectorId.includes('coinbase') ||
      connectorId.includes('smart') ||
      connectorType.includes('coinbase')
    );
    
    // Additional checks for Smart Wallet characteristics
    const hasSmartWalletFeatures = (
      connector.type === 'coinbaseWallet' || 
      connector.id === 'coinbaseWalletSDK' ||
      connector.id === 'coinbaseWallet' ||
      connector.id === 'smartWallet' ||
      // Check for MiniKit context which indicates Smart Wallet
      (typeof window !== 'undefined' && (window as any).MiniKit)
    );
    
    // If we're in a MiniKit context, we should assume Smart Wallet
    const inMiniKit = typeof window !== 'undefined' && (window as any).MiniKit;
    
    return isCoinbaseWallet && (hasSmartWalletFeatures || inMiniKit);
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