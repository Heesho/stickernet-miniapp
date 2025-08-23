"use client";

import { useCallback, useState, useEffect } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useEnsName,
  useEnsAvatar,
} from "wagmi";
import {
  Identity,
  Name,
  Avatar,
  Address,
  Badge,
  EthBalance,
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
import { Button } from "@/app/components/ui";
import { baseSepolia, base } from "wagmi/chains";

interface BaseAccountAuthProps {
  onAuthenticated?: (address: string, basename?: string) => void;
  className?: string;
}

export function BaseAccountAuth({
  onAuthenticated,
  className = "",
}: BaseAccountAuthProps) {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [basename, setBasename] = useState<string | null>(null);

  // Get ENS name (which includes Basenames on Base)
  const { data: ensName } = useEnsName({
    address: address,
    chainId: chain?.id || baseSepolia.id,
  });

  // Get ENS avatar
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: chain?.id || baseSepolia.id,
  });

  useEffect(() => {
    if (ensName) {
      // Check if it's a basename (ends with .base.eth)
      if (ensName.endsWith(".base.eth")) {
        setBasename(ensName);
      } else {
        setBasename(null);
      }
    }

    // Notify parent component of authentication
    if (isConnected && address && onAuthenticated) {
      onAuthenticated(address, basename || undefined);
    }
  }, [ensName, isConnected, address, basename, onAuthenticated]);

  return (
    <div className={`base-account-auth ${className}`}>
      <Wallet>
        <ConnectWallet
          className="w-full"
          text="Sign in with Base"
        >
          {isConnected && ensAvatar ? (
            <img
              src={ensAvatar}
              alt={basename || address || ""}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <Avatar className="h-6 w-6" />
          )}
          <span className="text-white">
            {isConnected && basename
              ? basename
              : isConnected && address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Sign in with Base"}
          </span>
        </ConnectWallet>

        <WalletDropdown>
          <div className="px-4 pt-3 pb-2 flex items-center gap-3">
            {ensAvatar ? (
              <img
                src={ensAvatar}
                alt={basename || address || ""}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <Identity address={address || "0x0"}>
                <Avatar
                  className="h-12 w-12 rounded-full"
                  loadingComponent={
                    <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                  }
                  defaultComponent={
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {address ? address.slice(2, 4).toUpperCase() : "ID"}
                    </div>
                  }
                />
              </Identity>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-base font-semibold">
                  {basename ||
                    (address
                      ? `${address.slice(0, 6)}...${address.slice(-4)}`
                      : "Not connected")}
                </span>
                {basename && (
                  <Identity address={address || "0x0"}>
                    <Badge />
                  </Identity>
                )}
              </div>
              <Identity address={address || "0x0"} hasCopyAddressOnClick>
                <Address className="text-xs text-gray-500" />
                <EthBalance className="text-xs text-gray-600" />
              </Identity>
            </div>
          </div>

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

      {/* Display Basename Info */}
      {isConnected && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                Connected
              </span>
            </div>

            {basename && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Basename:
                </span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {basename}
                </span>
              </div>
            )}

            {!basename && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  No Basename found. Get your Basename at{" "}
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

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Network:</span>
              <span className="text-sm font-medium">
                {chain?.name || "Base"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
