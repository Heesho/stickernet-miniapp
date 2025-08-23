"use client";

import { useMemo } from "react";
import { useAccount, useEnsName, useEnsAvatar } from "wagmi";
import {
  Identity,
  Name,
  Avatar,
  Badge,
  Address,
} from "@coinbase/onchainkit/identity";
import { baseSepolia, base } from "wagmi/chains";

interface BaseIdentityProps {
  address?: `0x${string}`;
  showAddress?: boolean;
  showBadge?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export function BaseIdentity({
  address: providedAddress,
  showAddress = false,
  showBadge = true,
  size = "md",
  className = "",
  onClick,
}: BaseIdentityProps) {
  const { address: connectedAddress, chain } = useAccount();
  const address = providedAddress || connectedAddress;

  // Get ENS/Basename
  const { data: ensName } = useEnsName({
    address: address,
    chainId: chain?.id || base.id,
  });

  // Get avatar
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: chain?.id || base.id,
  });

  const avatarSize = useMemo(() => {
    switch (size) {
      case "sm":
        return "h-8 w-8";
      case "lg":
        return "h-16 w-16";
      default:
        return "h-12 w-12";
    }
  }, [size]);

  const nameSize = useMemo(() => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-lg";
      default:
        return "text-base";
    }
  }, [size]);

  const basename = ensName?.endsWith(".base.eth") ? ensName : null;
  const displayName =
    basename ||
    (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");

  if (!address) {
    return null;
  }

  return (
    <div
      className={`base-identity flex items-center gap-3 ${className} ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
      onClick={onClick}
    >
      {/* Avatar Circle */}
      {ensAvatar ? (
        <img
          src={ensAvatar}
          alt={displayName}
          className={`${avatarSize} rounded-full object-cover`}
        />
      ) : (
        <Identity address={address}>
          <Avatar
            className={`${avatarSize} rounded-full`}
            loadingComponent={
              <div
                className={`${avatarSize} rounded-full bg-gray-200 animate-pulse`}
              />
            }
            defaultComponent={
              <div
                className={`${avatarSize} rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold`}
              >
                {address.slice(2, 4).toUpperCase()}
              </div>
            }
          />
        </Identity>
      )}

      {/* Name/Address Display */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`${nameSize} font-semibold text-white`}>
            {displayName}
          </span>
          {basename && showBadge && (
            <Identity address={address}>
              <Badge />
            </Identity>
          )}
        </div>

        {showAddress && basename && (
          <span className="text-xs text-gray-500">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}
      </div>
    </div>
  );
}

// Compact version for lists/cards
export function BaseIdentityCompact({
  address,
  className = "",
}: {
  address: `0x${string}`;
  className?: string;
}) {
  const { chain } = useAccount();

  // Get ENS/Basename
  const { data: ensName } = useEnsName({
    address: address,
    chainId: chain?.id || base.id,
  });

  // Get avatar
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: chain?.id || base.id,
  });

  const basename = ensName?.endsWith(".base.eth") ? ensName : null;
  const displayName =
    basename || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {ensAvatar ? (
        <img
          src={ensAvatar}
          alt={displayName}
          className="h-6 w-6 rounded-full object-cover"
        />
      ) : (
        <Identity address={address}>
          <Avatar className="h-6 w-6 rounded-full" />
        </Identity>
      )}
      <span className="text-sm text-gray-300">{displayName}</span>
    </div>
  );
}
