"use client";

import { 
  Identity,
  Name,
  Avatar,
  Badge,
  Address,
  EthBalance,
  IdentityCard
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
import { base } from "viem/chains";
import { useAccount } from "wagmi";

interface BaseIdentityProfileProps {
  address?: `0x${string}`;
  isOwnProfile?: boolean;
  className?: string;
}

// Profile identity component matching the GitHub repo style
export function BaseIdentityProfile({ 
  address: providedAddress,
  isOwnProfile = false,
  className = ""
}: BaseIdentityProfileProps) {
  const { address: connectedAddress } = useAccount();
  const address = providedAddress || connectedAddress;
  
  if (!address) {
    return null;
  }
  
  // Compact badge style for own profile with wallet dropdown
  if (isOwnProfile) {
    return (
      <Wallet>
        <ConnectWallet 
          className={`inline-flex items-center gap-2 bg-[#1C1C1C] hover:bg-[#262626] transition-colors rounded-full px-3 py-1.5 ${className}`}
          withWalletAggregator={false}
        >
          <Avatar className="h-6 w-6 rounded-full" address={address} chain={base} />
          <Name className="text-sm font-medium text-white" address={address} chain={base} />
        </ConnectWallet>
        
        <WalletDropdown>
          <Identity 
            className="px-4 pt-3 pb-2" 
            hasCopyAddressOnClick
            address={address}
            chain={base}
            schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
          >
            <Avatar className="h-12 w-12 rounded-full" />
            <Name className="text-base font-semibold">
              <Badge />
            </Name>
            <Address className="text-xs text-gray-500" />
            <EthBalance className="text-xs text-gray-600" />
          </Identity>
          
          <WalletDropdownBasename />
          <WalletDropdownFundLink />
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
    );
  }
  
  // Expanded card style for other profiles - using IdentityCard like the repo
  return (
    <div className={className}>
      <IdentityCard
        address={address}
        schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
        chain={base}
        badgeTooltip="Base Verified"
      />
    </div>
  );
}