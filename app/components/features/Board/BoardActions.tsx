import React, { memo } from 'react';

interface BoardActionsProps {
  totalVolume: string;
  onCreateSticker: () => void;
  themeColor: string;
}

export const BoardActions = memo(function BoardActions({
  totalVolume,
  onCreateSticker,
  themeColor
}: BoardActionsProps) {
  return (
    <div className="fixed bottom-16 left-0 right-0">
      <div className="w-full max-w-md mx-auto bg-black px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Today's steal volume */}
          <div>
            <div className="text-white text-sm opacity-70">Today's steal volume</div>
            <div className="text-white text-2xl font-bold">
              ${totalVolume}
            </div>
          </div>
          
          {/* Create button */}
          <button 
            onClick={onCreateSticker}
            className="hover:opacity-90 text-black font-semibold py-2.5 px-8 rounded-xl border-2 min-w-[120px] transition-opacity"
            style={{ 
              backgroundColor: themeColor,
              borderColor: themeColor
            }}
          >
            Stick
          </button>
        </div>
      </div>
    </div>
  );
});