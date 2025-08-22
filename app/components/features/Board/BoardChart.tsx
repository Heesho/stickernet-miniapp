import React, { memo } from 'react';
import { TradingView } from './TradingView';
import type { BoardChartProps } from './Board.types';

export const BoardChart = memo(function BoardChart({
  tokenAddress,
  tokenSymbol,
  tokenName,
  tokenPrice,
  priceChange24h,
  priceChangeAmount,
  priceChange1h,
  userPosition,
  todayVolume,
  onPriceHover,
  tokenData,
  subgraphData,
  onTimeframeChange
}: BoardChartProps) {
  return (
    <TradingView
      tokenAddress={tokenAddress}
      tokenSymbol={tokenSymbol}
      tokenName={tokenName}
      tokenPrice={tokenPrice}
      priceChange24h={priceChange24h}
      priceChangeAmount={priceChangeAmount}
      priceChange1h={priceChange1h}
      userPosition={userPosition}
      todayVolume={todayVolume}
      onPriceHover={onPriceHover}
      tokenData={tokenData}
      subgraphData={subgraphData}
      onTimeframeChange={onTimeframeChange}
    />
  );
});