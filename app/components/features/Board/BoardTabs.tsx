import React, { memo } from 'react';
import { CurateImage } from "../Home/CurateImage";
import type { BoardTabsProps } from './Board.types';

export const BoardTabs = memo(function BoardTabs({
  curates,
  onImageClick
}: BoardTabsProps) {
  return (
    <div className="columns-2 gap-4">
      {curates.map((curate, index) => (
        <CurateImage 
          key={curate.id} 
          curate={curate} 
          index={index}
          onImageClick={() => onImageClick(curate)}
          isNew={false}
        />
      ))}
    </div>
  );
});