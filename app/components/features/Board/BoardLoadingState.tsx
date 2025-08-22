import React, { memo } from 'react';

export const BoardLoadingState = memo(function BoardLoadingState() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between p-4 mb-4">
        <div className="w-8 h-8 bg-[var(--app-gray)] animate-pulse rounded-lg"></div>
        <div className="w-24 h-6 bg-[var(--app-gray)] animate-pulse rounded"></div>
      </div>
      <div className="p-4 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-[var(--app-gray)] animate-pulse rounded-2xl"></div>
          <div className="flex-1">
            <div className="w-24 h-6 bg-[var(--app-gray)] animate-pulse rounded mb-2"></div>
            <div className="w-16 h-4 bg-[var(--app-gray)] animate-pulse rounded"></div>
          </div>
        </div>
      </div>
      <div className="columns-2 gap-4 px-4">
        {Array.from({length: 8}).map((_, i) => (
          <div key={i} className="mb-4 break-inside-avoid">
            <div className="bg-[var(--app-card-bg)] rounded-2xl overflow-hidden">
              <div 
                className="w-full bg-[var(--app-gray)] animate-pulse rounded-2xl"
                style={{ height: `${200 + (i % 3) * 100}px` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});