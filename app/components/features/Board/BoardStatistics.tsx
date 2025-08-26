import React, { memo } from 'react';
import Image from 'next/image';
import dynamic from "next/dynamic";
import { useRouter } from 'next/navigation';
import { AnimatedNumber } from "../../ui/AnimatedNumber";
import type { BoardStatisticsProps } from './Board.types';

// Client-only OnchainKit Identity components with error handling
const Avatar = dynamic(
  () => import("@coinbase/onchainkit/identity").then((mod) => ({ default: mod.Avatar }))
    .catch(() => ({ 
      // Fallback component if module fails to load
      default: ({ address }: { address?: `0x${string}` | null }) => <div className="w-8 h-8 bg-[var(--app-gray)] rounded-full" /> 
    })),
  { 
    ssr: false,
    loading: () => <div className="w-8 h-8 bg-[var(--app-gray)] animate-pulse rounded-full" />
  }
);

const Name = dynamic(
  () => import("@coinbase/onchainkit/identity").then((mod) => ({ default: mod.Name }))
    .catch(() => ({ 
      // Fallback component if module fails to load
      default: ({ address }: { address?: `0x${string}` | null }) => (
        <span className="text-gray-400 text-sm">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
        </span>
      )
    })),
  { 
    ssr: false,
    loading: () => <div className="w-16 h-4 bg-[var(--app-gray)] animate-pulse rounded" />
  }
);

export const BoardStatistics = memo(function BoardStatistics({
  token,
  hoveredPrice,
  hoveredFloorPrice,
  timeframePriceData,
  tokenAvatarError,
  onTokenAvatarError,
  showTradingView,
  subgraphData
}: BoardStatisticsProps) {
  const router = useRouter();
  
  const handleOwnerClick = () => {
    if (token.owner) {
      router.push(`/u/${token.owner}`);
    }
  };

  return (
    <div>
      {/* Token name, symbol, price and cover image */}
      <div className="flex justify-between items-start mb-4 mt-2">
        <div className="flex-1">
          <div className="text-white text-sm mb-1">
            {token.name}
          </div>
          <div className="text-white text-5xl font-bold mb-2">
            {token.symbol || "PEPE"}
          </div>
          <div>
            <div className="text-white text-3xl">
              <AnimatedNumber 
                value={hoveredPrice || token.price}
                prefix="$"
                decimals={6}
                duration={600}
                animateOnMount={false}
              />
            </div>
            <div className="text-gray-500 text-sm mt-1">
              ${(() => {
                // Use hovered floor price if available, otherwise use subgraph floor price
                const floorPrice = hoveredFloorPrice || 
                  (subgraphData?.floorPrice ? 
                    parseFloat(subgraphData.floorPrice).toFixed(6) : 
                    (parseFloat(token.price) * 0.95).toFixed(6));
                return floorPrice;
              })()} floor
            </div>
          </div>
        </div>
        
        {/* Token cover image */}
        <div className="ml-4">
          {!tokenAvatarError ? (
            <Image
              src={token.uri}
              alt={`${token.name} cover`}
              width={120}
              height={120}
              className="w-[120px] h-[120px] rounded-2xl object-cover"
              onError={onTokenAvatarError}
            />
          ) : (
            <div className="w-[120px] h-[120px] bg-green-500 rounded-2xl flex items-center justify-center">
              <div className="w-10 h-10 bg-white rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Price change indicator */}
      <div className="flex items-center mb-6">
        <div className={`flex items-center space-x-1 ${timeframePriceData.priceChange >= 0 ? 'text-[#0052FF]' : 'text-[#ceb1ff]'}`}>
          {/* Triangle indicator */}
          <span className="text-lg">
            {timeframePriceData.priceChange >= 0 ? '▲' : '▼'}
          </span>
          <span className="text-base font-medium">
            ${Math.abs(parseFloat(timeframePriceData.priceChangeAmount)).toFixed(6)} ({Math.abs(timeframePriceData.priceChange).toFixed(2)}%)
          </span>
        </div>
        <span className="text-white opacity-70 text-base ml-2">{timeframePriceData.label}</span>
      </div>

      {/* Board description and owner - only show in board view */}
      {!showTradingView && (
        <>
          {/* Board description */}
          <p className="text-white text-base mb-6">
            This is a description about this board where the creator can say... 
            <button className="text-white opacity-70 ml-2">more</button>
          </p>

          {/* Owner info and options */}
          <div className="flex items-center justify-between mb-8">
            {/* Owner with OnchainKit Identity - clickable */}
            <button 
              onClick={handleOwnerClick}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <Avatar 
                address={token.owner as `0x${string}`} 
                className="w-8 h-8" 
              />
              <Name 
                address={token.owner as `0x${string}`} 
                className="text-white text-base" 
              />
            </button>
            
            {/* Options button */}
            <button className="text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
});