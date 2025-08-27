"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useChainId } from "wagmi";
import { formatUnits, parseUnits, encodeFunctionData } from "viem";
import { LoadingSpinner, Button, Icon } from "../../ui";
import {
  executeGraphQLQuery,
  USDC_ADDRESS,
  USDC_ABI,
  USDC_DECIMALS,
  TEST_USDC_MINT_AMOUNT,
} from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { base, baseSepolia } from "wagmi/chains";
import { isTokenBlacklisted } from "@/lib/constants/blacklist";
import { TokenImage } from "../../ui/TokenImage";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import {
  Transaction,
  TransactionButton,
} from "@coinbase/onchainkit/transaction";
import { getPaymasterActions } from "@/lib/paymaster";
import { BaseIdentityProfile } from "../BaseAccount/BaseIdentityProfile";
import { BaseAccountAuth } from "../BaseAccount";

// GraphQL query to fetch all user data
const GET_USER_PROFILE_QUERY = `
  query GetUserProfile($userId: String!) {
    user(id: $userId) {
      id
      txCount
      
      # Tokens the user owns (boards)
      tokensOwned {
        id
        name
        symbol
        uri
        marketPrice
        marketCap
        holders
        contents
        contentBalance
      }
      
      # Token positions (shares)
      tokenPositions {
        id
        token {
          id
          name
          symbol
          uri
          marketPrice
        }
        balance
        debt
        contentCreated
        contentOwned
      }
      
      # Content created (stickers)
      contentCreated {
        id
        tokenId
        uri
        price
        nextPrice
        token {
          id
          name
          symbol
        }
      }
      
      # Content owned (collection)
      contentOwned {
        id
        tokenId
        uri
        price
        nextPrice
        token {
          id
          name
          symbol
        }
      }
    }
  }
`;

interface UserProfileData {
  user: {
    id: string;
    txCount: string;
    tokensOwned: Array<{
      id: string;
      name: string;
      symbol: string;
      uri: string;
      marketPrice: string;
      marketCap: string;
      holders: string;
      contents: string;
      contentBalance?: string;
    }>;
    tokenPositions: Array<{
      id: string;
      token: {
        id: string;
        name: string;
        symbol: string;
        uri: string;
        marketPrice: string;
      };
      balance: string;
      debt: string;
      contentCreated: string;
      contentOwned: string;
    }>;
    contentCreated: Array<{
      id: string;
      tokenId: string;
      uri: string;
      price: string;
      nextPrice: string;
      token: {
        id: string;
        name: string;
        symbol: string;
      };
    }>;
    contentOwned: Array<{
      id: string;
      tokenId: string;
      uri: string;
      price: string;
      nextPrice: string;
      token: {
        id: string;
        name: string;
        symbol: string;
      };
    }>;
  };
}

type TabType = "shares" | "collection" | "boards" | "stickers";

interface ProfileViewProps {
  userAddress?: string;
}

export function ProfileView({ userAddress: propAddress }: ProfileViewProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const router = useRouter();
  const chainId = useChainId();
  const userAddress = propAddress || connectedAddress;

  const [activeTab, setActiveTab] = useState<TabType>("shares");
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositState, setDepositState] = useState<
    "idle" | "loading" | "success"
  >("idle");

  // USDC balance query
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
      refetchInterval: 5000,
    },
  });

  // Calculate portfolio value
  const calculatePortfolioValue = () => {
    let totalValue = 0;
    let cashFromPositions = 0;

    // Add value from token positions (shares) if profile data exists
    if (profileData?.user?.tokenPositions) {
      profileData.user.tokenPositions
        .filter(position => !isTokenBlacklisted(position.token.id))
        .forEach((position) => {
          const balance = parseFloat(position.balance || "0");
          const marketPrice = parseFloat(position.token.marketPrice || "0");
          const value = balance * marketPrice;
          totalValue += value;

          // Fallback cash from subgraph (debt)
          cashFromPositions += parseFloat(position.debt || "0");
        });
    }

    // Always check on-chain USDC balance when available, regardless of profileData
    let cash = 0;
    console.log('Debug - chainId:', chainId, 'baseSepolia.id:', baseSepolia.id, 'usdcBalance:', usdcBalance);
    if (usdcBalance !== undefined && chainId === baseSepolia.id) {
      cash = parseFloat(formatUnits(usdcBalance as bigint, USDC_DECIMALS));
      console.log('Using on-chain USDC balance:', cash, 'raw:', usdcBalance?.toString());
    } else {
      cash = cashFromPositions;
      console.log('Using fallback cash from positions:', cash, 'chainId:', chainId, 'usdcBalance:', usdcBalance);
    }

    return { total: totalValue + cash, cash };
  };

  // Fetch user profile data
  const fetchProfileData = useCallback(async () => {
    if (!userAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await executeGraphQLQuery<UserProfileData>(
        GET_USER_PROFILE_QUERY,
        { userId: userAddress.toLowerCase() },
      );

      if (response.data) {
        setProfileData(response.data);
      } else {
        setError("No profile data found");
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    // Initialize preferred tab from localStorage (e.g., set by Create success)
    try {
      const preferred = localStorage.getItem(
        "profileActiveTab",
      ) as TabType | null;
      if (
        preferred &&
        ["shares", "collection", "boards", "stickers"].includes(preferred)
      ) {
        setActiveTab(preferred);
        localStorage.removeItem("profileActiveTab");
      }
    } catch {}
    fetchProfileData();
  }, [fetchProfileData]);

  // Refetch balance when address or chain changes
  useEffect(() => {
    if (userAddress && chainId === baseSepolia.id) {
      refetchBalance();
    }
  }, [userAddress, chainId, refetchBalance]);

  if (!userAddress) {
    return (
      <div className="animate-fade-in">
        {/* Profile Header for Disconnected Users */}
        <div className="mb-6 pb-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-400">
                  Not connected
                </h2>
              </div>
            </div>
            {/* Sign In with Base Button */}
            <BaseAccountAuth className="" />
          </div>

          {/* Portfolio Value Placeholder */}
          <div className="mt-4">
            <div className="text-3xl font-bold text-gray-600">$0.00</div>
            <div className="text-sm text-gray-500">
              Sign in to view your portfolio
            </div>
          </div>
        </div>

        {/* Empty State Message */}
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Icon name="wallet" size="lg" className="mb-4 text-gray-600" />
          <p className="text-lg font-medium mb-2">Connect with Base</p>
          <p className="text-sm text-gray-400 text-center max-w-sm">
            Sign in with your Base account to start trading stickers and
            managing your portfolio
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <p>{error || "Failed to load profile"}</p>
      </div>
    );
  }

  const { total: portfolioValue, cash: cashValue } = calculatePortfolioValue();

  return (
    <div className="animate-fade-in">
      {/* Sticky Container for Header and Tabs */}
      <div className="sticky top-0 bg-black z-10 -mx-4 px-4 pt-4 pb-2">
        {/* Profile Header */}
        <div className="pb-4">
        <div className="flex items-start justify-between gap-2 w-full">
          {/* User Identity - Show compact for own profile, expanded for others */}
          <BaseIdentityProfile
            address={userAddress as `0x${string}`}
            isOwnProfile={
              !!(
                connectedAddress &&
                userAddress &&
                connectedAddress.toLowerCase() === userAddress.toLowerCase()
              )
            }
          />

          {/* Deposit Button - Far Right - Only show on own profile */}
          {isConnected &&
            connectedAddress &&
            userAddress &&
            connectedAddress.toLowerCase() === userAddress.toLowerCase() && (
              <div className="flex-shrink-0">
                <Transaction
                  calls={[
                    {
                      to: USDC_ADDRESS,
                      data: encodeFunctionData({
                        abi: USDC_ABI,
                        functionName: "mint",
                        args: [
                          connectedAddress,
                          parseUnits(TEST_USDC_MINT_AMOUNT, USDC_DECIMALS),
                        ],
                      }),
                      value: BigInt(0),
                    },
                  ]}
                  capabilities={{
                    paymasterService: getPaymasterActions(),
                  }}
                  chainId={baseSepolia.id}
                  onSuccess={(response) => {
                    // This fires after transaction is confirmed
                    setTimeout(() => {
                      refetchBalance();
                    }, 2000);
                  }}
                  onError={(error) => {
                    console.error("USDC mint failed:", error);
                    setDepositState("idle");
                  }}
                >
                  <TransactionButton
                    text={
                      depositState === "loading" ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeOpacity="0.25"
                              />
                              <path
                                d="M12 2a10 10 0 0 1 0 20"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          Minting...
                        </span>
                      ) : depositState === "success" ? (
                        <span className="flex items-center gap-2">
                          <Icon name="check" size="sm" />
                          Success!
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Icon name="deposit" size="sm" />
                          Mint 1K USDC
                        </span>
                      )
                    }
                    disabled={depositState !== "idle"}
                    className="px-3 py-2 bg-[#0052FF] text-white text-sm font-medium rounded-lg hover:bg-[#0041CC] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  />
                </Transaction>
              </div>
            )}
        </div>

        {/* Portfolio Value */}
        <div className="mt-4">
          <div className="text-3xl font-bold text-white">
            {formatCurrency(portfolioValue)}
          </div>
          <div className="text-sm text-gray-400">
            {`${formatCurrency(cashValue)} cash`}
          </div>
        </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
        {(["shares", "collection", "boards", "stickers"] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#0052FF] text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ),
        )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4 pb-20 mt-4">
        {/* Shares Tab */}
        {activeTab === "shares" && (
          <div className="space-y-3">
            {profileData.user?.tokenPositions?.filter(position => !isTokenBlacklisted(position.token.id)).length > 0 ? (
              profileData.user.tokenPositions
                .filter(position => !isTokenBlacklisted(position.token.id))
                .map((position) => {
                const balance = parseFloat(position.balance || "0");
                const marketPrice = parseFloat(
                  position.token.marketPrice || "0",
                );
                const value = balance * marketPrice;

                return (
                  <div
                    key={position.id}
                    onClick={() => router.push(`/b/${position.token.id}`)}
                    className="flex items-center justify-between py-3 rounded-lg hover:bg-gray-900/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden">
                        <TokenImage
                          uri={position.token.uri}
                          name={position.token.symbol}
                          size={40}
                          className="w-full h-full rounded-full"
                        />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {position.token.symbol}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatNumber(balance, 2)} shares
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {formatCurrency(value)}
                      </div>
                      <div className="text-sm text-gray-400">
                        ${marketPrice.toFixed(4)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-8">
                No shares owned
              </div>
            )}
          </div>
        )}

        {/* Collection Tab */}
        {activeTab === "collection" && (
          <div className="grid grid-cols-2 gap-3">
            {profileData.user?.contentOwned?.length > 0 ? (
              profileData.user.contentOwned.map((content) => (
                <div
                  key={content.id}
                  onClick={() =>
                    router.push(`/b/${content.token.id}/${content.tokenId}`)
                  }
                  className="relative bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all"
                >
                  <div className="aspect-square">
                    <Image
                      src={content.uri}
                      alt={`Sticker ${content.tokenId}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 p-2">
                    <div className="text-xs text-white font-medium bg-black/70 backdrop-blur-sm rounded px-2 py-1 inline-block">
                      {formatCurrency(content.price)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-gray-500 py-8">
                No stickers in collection
              </div>
            )}
          </div>
        )}

        {/* Boards Tab */}
        {activeTab === "boards" && (
          <div className="space-y-3">
            {profileData.user?.tokensOwned?.filter(token => !isTokenBlacklisted(token.id)).length > 0 ? (
              profileData.user.tokensOwned
                .filter(token => !isTokenBlacklisted(token.id))
                .map((token) => (
                <div
                  key={token.id}
                  onClick={() => router.push(`/b/${token.id}`)}
                  className="flex items-center justify-between py-3 rounded-lg hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden">
                      <TokenImage
                        uri={token.uri}
                        name={token.symbol}
                        size={40}
                        className="w-full h-full rounded-full"
                      />
                    </div>
                    <div>
                      <div className="text-white font-medium">{token.name}</div>
                      <div className="text-sm text-gray-400">
                        {token.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {formatCurrency(token.marketCap)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatCurrency(token.contentBalance || "0")}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No boards created
              </div>
            )}
          </div>
        )}

        {/* Stickers Tab */}
        {activeTab === "stickers" && (
          <div className="grid grid-cols-2 gap-3">
            {profileData.user?.contentCreated?.length > 0 ? (
              profileData.user.contentCreated.map((content) => (
                <div
                  key={content.id}
                  onClick={() =>
                    router.push(`/b/${content.token.id}/${content.tokenId}`)
                  }
                  className="relative bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all"
                >
                  <div className="aspect-square">
                    <Image
                      src={content.uri}
                      alt={`Sticker ${content.tokenId}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 p-2">
                    <div className="text-xs text-white font-medium bg-black/70 backdrop-blur-sm rounded px-2 py-1 inline-block">
                      {formatCurrency(content.price)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-gray-500 py-8">
                No stickers created
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
