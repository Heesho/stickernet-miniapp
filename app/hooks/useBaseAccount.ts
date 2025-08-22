import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import type { Address } from 'viem';
import { useErrorHandler } from './useErrorHandler';

export interface BaseAccountInfo {
  isBaseSmartWallet: boolean;
  isConnected: boolean;
  address: Address | undefined;
  connector: string | undefined;
  chainId: number | undefined;
  error: string | null;
  hasError: boolean;
}

/**
 * Hook to detect and validate Base Smart Wallet connections
 * Ensures users are connecting with Base account abstraction
 */
export function useBaseAccount(): BaseAccountInfo {
  const { address, isConnected, chainId, connector } = useAccount();
  const errorHandler = useErrorHandler({
    hookName: 'useBaseAccount',
    showToast: false, // Don't show toast for wallet detection
    enableLogging: true
  });

  const isBaseSmartWallet = useMemo(() => {
    try {
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
        (typeof window !== 'undefined' && (window as { MiniKit?: unknown }).MiniKit)
      );
      
      // If we're in a MiniKit context, we should assume Smart Wallet
      const inMiniKit = typeof window !== 'undefined' && (window as { MiniKit?: unknown }).MiniKit;
      
      return isCoinbaseWallet && (hasSmartWalletFeatures || inMiniKit);
    } catch (error) {
      errorHandler.handleError(error, {
        context: 'wallet_detection',
        connector: connector?.name,
        connectorId: connector?.id
      });
      return false;
    }
  }, [connector, isConnected, errorHandler]);

  return {
    isBaseSmartWallet,
    isConnected,
    address,
    connector: connector?.name,
    chainId,
    error: errorHandler.getErrorMessage(),
    hasError: errorHandler.hasError,
  };
}

/**
 * Hook to enforce Base Smart Wallet only connections
 * Returns connection status with enforcement
 */
export function useEnforceBaseWallet(): ReturnType<typeof useBaseAccount> & { shouldShowWarning: boolean; isValidConnection: boolean } {
  const accountInfo = useBaseAccount();
  
  const shouldShowWarning = accountInfo.isConnected && !accountInfo.isBaseSmartWallet;
  
  return {
    ...accountInfo,
    shouldShowWarning,
    isValidConnection: accountInfo.isConnected && accountInfo.isBaseSmartWallet,
  };
}