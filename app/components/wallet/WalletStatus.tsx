"use client";

import { useAccount } from "wagmi";
import { useEnforceBaseWallet } from "../../hooks/useBaseAccount";
import { Icon } from "../ui";

interface WalletStatusProps {
  className?: string;
  showText?: boolean;
}

export function WalletStatus({ className = "", showText = true }: WalletStatusProps) {
  const { isConnected } = useAccount();
  const { isValidConnection, shouldShowWarning } = useEnforceBaseWallet();

  if (!isConnected) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
        {showText && <span className="text-xs text-gray-500">Not Connected</span>}
      </div>
    );
  }

  if (shouldShowWarning || !isValidConnection) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <Icon name="warning" size="sm" className="text-yellow-500" />
        {showText && <span className="text-xs text-yellow-500">Wrong Wallet</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      {showText && <span className="text-xs text-green-500">Smart Wallet</span>}
    </div>
  );
}