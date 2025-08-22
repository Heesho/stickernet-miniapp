"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAccount, useEnsName, useEnsAvatar } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

interface UserIdentity {
  address: `0x${string}`;
  basename: string | null;
  avatarUrl: string | null;
  isAuthenticated: boolean;
  chain: number;
}

interface UserContextType {
  user: UserIdentity | null;
  updateUser: (data: Partial<UserIdentity>) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chain } = useAccount();
  const [user, setUser] = useState<UserIdentity | null>(null);
  
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
  
  useEffect(() => {
    if (isConnected && address) {
      const basename = ensName?.endsWith('.base.eth') ? ensName : null;
      
      setUser({
        address,
        basename,
        avatarUrl: ensAvatar || null,
        isAuthenticated: true,
        chain: chain?.id || baseSepolia.id,
      });
    } else {
      setUser(null);
    }
  }, [isConnected, address, ensName, ensAvatar, chain]);
  
  const updateUser = (data: Partial<UserIdentity>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };
  
  const clearUser = () => {
    setUser(null);
  };
  
  return (
    <UserContext.Provider value={{ user, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}