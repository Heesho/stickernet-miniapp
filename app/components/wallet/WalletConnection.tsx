"use client";

import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import { useEnforceBaseWallet } from "../../hooks/useBaseAccount";
import { Icon } from "../ui";

interface WalletConnectionProps {
  className?: string;
  showIdentity?: boolean;
  compact?: boolean;
}

// Create a client-only wallet component to prevent hydration issues
const ClientOnlyWallet = dynamic(
  () => Promise.resolve(function ClientWallet({ className = "", showIdentity = true, compact = false }: WalletConnectionProps) {
    const { isConnected } = useAccount();
    const { shouldShowWarning, connector, isValidConnection } = useEnforceBaseWallet();
    
    return (
      <div className={className}>
        {/* Base Smart Wallet Warning */}
        {shouldShowWarning && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Icon name="warning" size="sm" className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Base Smart Wallet Required
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                  Please connect with your Coinbase Smart Wallet for gasless transactions.
                </p>
                {connector && (
                  <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                    Current: {connector}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Wallet>
          <ConnectWallet 
            className={`w-full ${compact ? 'text-sm py-2' : ''}`}
            text={compact ? "Connect" : "Connect Wallet"} 
          />
          {showIdentity && (
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar className={compact ? "w-8 h-8" : "w-12 h-12"} />
                <Name className={compact ? "text-xs font-semibold" : "text-sm font-semibold"} />
                <Address className="text-xs" />
                <EthBalance className="text-xs" />
              </Identity>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          )}
        </Wallet>
      </div>
    );
  }),
  { ssr: false }
);

export function WalletConnection(props: WalletConnectionProps) {
  return <ClientOnlyWallet {...props} />;
}