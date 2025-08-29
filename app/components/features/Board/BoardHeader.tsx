import React, { memo } from 'react';
import type { BoardHeaderProps } from './Board.types';

export const BoardHeader = memo(function BoardHeader({
  tokenSymbol,
  onBackToHome,
  showTradingView,
  onToggleView,
  scrollY,
  themeColors
}: BoardHeaderProps) {
  // Calculate opacity for the header symbol based on scroll position
  const headerSymbolOpacity = Math.min(scrollY / 100, 1);

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className="w-full max-w-md mx-auto bg-black">
        <div className="relative flex items-center justify-between p-4">
          {/* Back button */}
          <button 
            onClick={onBackToHome}
            className={`${themeColors.colorClass} hover:opacity-80 transition-all z-10`}
            style={{ color: themeColors.color }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          
          {/* Symbol that fades in when scrolling - centered */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 text-white text-2xl font-bold transition-opacity duration-200"
            style={{ opacity: headerSymbolOpacity }}
          >
            {tokenSymbol || "PEPE"}
          </div>
          
          {/* View switcher button (board/token view) - shows grid when in trading, chart when in board */}
          <button 
            onClick={onToggleView}
            className={`w-9 h-9 ${themeColors.bgClass} rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-all z-10`}
          >
            {showTradingView ? (
              // Grid icon - to go back to board view
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            ) : (
              // Chart icon - to go to trading view
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="m7 16 4-8 4 8 5-5"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});