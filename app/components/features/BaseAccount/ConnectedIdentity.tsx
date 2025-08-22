"use client";

import { 
  Identity,
  Name,
  Avatar,
  Badge,
  Address,
  EthBalance
} from "@coinbase/onchainkit/identity";
import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
  WalletDropdownFundLink,
  WalletDropdownLink,
} from "@coinbase/onchainkit/wallet";
import { base, baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";

interface ConnectedIdentityProps {
  className?: string;
}

export function ConnectedIdentity({ className = "" }: ConnectedIdentityProps) {
  const { address, isConnected, chain } = useAccount();
  
  // Use base mainnet for Basename resolution
  const nameResolutionChain = base;
  
  return (
    <div className={className}>
      <Wallet>
        <ConnectWallet 
          className="bg-transparent hover:bg-gray-900 transition-colors rounded-lg"
          withWalletAggregator={false}
        >
          <Avatar className="h-10 w-10" address={address} chain={nameResolutionChain} />
          <Name className="text-white" address={address} chain={nameResolutionChain} />
        </ConnectWallet>
        
        <WalletDropdown>
          <Identity 
            className="px-4 pt-3 pb-2" 
            hasCopyAddressOnClick
            address={address}
            chain={nameResolutionChain}
            schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
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
    </div>
  );
}