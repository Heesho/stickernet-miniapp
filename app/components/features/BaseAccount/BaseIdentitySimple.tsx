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
import { base, baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";

interface BaseIdentitySimpleProps {
  address?: `0x${string}`;
  showBalance?: boolean;
  showAddress?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  schemaId?: `0x${string}`;
  chain?: typeof base | typeof baseSepolia;
}

// Simple identity display using OnchainKit components
export function BaseIdentitySimple({ 
  address: providedAddress,
  showBalance = false,
  showAddress = false,
  size = "md",
  className = "",
  schemaId,
  chain = base
}: BaseIdentitySimpleProps) {
  const { address: connectedAddress } = useAccount();
  const address = providedAddress || connectedAddress;
  
  if (!address) {
    return null;
  }
  
  const avatarSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";
  
  return (
    <Identity 
      address={address}
      schemaId={schemaId}
      chain={chain}
      className={`flex items-center gap-3 ${className}`}
    >
      <Avatar className={avatarSize} />
      <div className="flex flex-col">
        <Name className={`${textSize} font-semibold text-white`}>
          <Badge />
        </Name>
        {showAddress && <Address className="text-xs text-gray-500" />}
        {showBalance && <EthBalance className="text-xs text-gray-600" />}
      </div>
    </Identity>
  );
}

// Card version for profile display
export function BaseIdentityCard({ 
  address: providedAddress,
  className = "",
  schemaId = "0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9",
  chain = base,
  badgeTooltip = true
}: {
  address?: `0x${string}`;
  className?: string;
  schemaId?: `0x${string}`;
  chain?: typeof base | typeof baseSepolia;
  badgeTooltip?: boolean | string;
}) {
  const { address: connectedAddress } = useAccount();
  const address = providedAddress || connectedAddress;
  
  if (!address) {
    return (
      <div className="text-gray-500">
        No wallet connected
      </div>
    );
  }
  
  return (
    <IdentityCard
      address={address}
      schemaId={schemaId}
      chain={chain}
      className={className}
      badgeTooltip={badgeTooltip}
    />
  );
}

// Inline compact version for lists
export function BaseIdentityInline({ 
  address,
  className = ""
}: {
  address: `0x${string}`;
  className?: string;
}) {
  return (
    <Identity 
      address={address}
      chain={base}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <Avatar className="h-6 w-6" />
      <Name className="text-sm text-gray-300" />
    </Identity>
  );
}