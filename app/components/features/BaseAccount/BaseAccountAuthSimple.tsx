"use client";

import { useAccount } from "wagmi";
import { 
  Identity,
  Name,
  Avatar,
  Address,
  Badge,
  EthBalance
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
  WalletDropdownFundLink,
  WalletDropdownLink,
} from "@coinbase/onchainkit/wallet";
import { base, baseSepolia } from "wagmi/chains";

interface BaseAccountAuthSimpleProps {
  className?: string;
}

export function BaseAccountAuthSimple({ className = "" }: BaseAccountAuthSimpleProps) {
  const { address, isConnected, chain } = useAccount();
  
  return (
    <div className={`base-account-auth ${className}`}>
      <Wallet>
        <ConnectWallet 
          className="w-full"
          text="Sign in with Base"
        >
          <Avatar className="h-6 w-6" />
          <Name className="text-white" />
        </ConnectWallet>
        
        <WalletDropdown>
          <Identity 
            className="px-4 pt-3 pb-2" 
            hasCopyAddressOnClick
            address={address}
            chain={chain || base}
          >
            <Avatar className="h-12 w-12" />
            <Name className="text-base font-semibold">
              <Badge />
            </Name>
            <Address className="text-xs text-gray-500" />
            <EthBalance className="text-xs text-gray-600" />
          </Identity>
          
          {/* Basename management link */}
          <WalletDropdownBasename />
          
          {/* Fund wallet link */}
          <WalletDropdownFundLink />
          
          {/* Link to Base.org profile */}
          <WalletDropdownLink 
            icon="wallet" 
            href="https://base.org/names"
            target="_blank"
            rel="noopener noreferrer"
          >
            Manage Basename
          </WalletDropdownLink>
          
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
      
      {/* Display connection info */}
      {isConnected && address && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Identity address={address} chain={chain || base}>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10" />
              <div className="flex flex-col">
                <Name className="text-sm font-semibold">
                  <Badge />
                </Name>
                <Address className="text-xs text-gray-500" />
              </div>
            </div>
          </Identity>
          
          {!address && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                Get your Basename at{" "}
                <a 
                  href="https://base.org/names" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  base.org/names
                </a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}