import React, { memo } from 'react';
import { CreateSticker } from "./CreateSticker";
import { ImageDetail } from "../Home/ImageDetail";
import type { Curate } from "@/lib/constants";
import type { BoardData } from "@/types";

interface BoardModalsProps {
  selectedCurate: Curate | null;
  onCloseCurate: () => void;
  onCurate: () => Promise<void>;
  showCreateSticker: boolean;
  onCloseCreateSticker: () => void;
  onCreateStickerSuccess: () => void;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  boardData: BoardData | null;
}

export const BoardModals = memo(function BoardModals({
  selectedCurate,
  onCloseCurate,
  onCurate,
  showCreateSticker,
  onCloseCreateSticker,
  onCreateStickerSuccess,
  tokenAddress,
  tokenSymbol,
  tokenName,
  boardData
}: BoardModalsProps) {
  return (
    <>
      {/* Image Detail Modal */}
      {selectedCurate && (
        <ImageDetail
          curate={selectedCurate}
          onClose={onCloseCurate}
          onCurate={onCurate}
        />
      )}

      {/* Create Sticker Modal */}
      {showCreateSticker && boardData && (
        <CreateSticker
          tokenAddress={tokenAddress}
          tokenSymbol={tokenSymbol}
          tokenName={tokenName}
          onClose={onCloseCreateSticker}
          onSuccess={onCreateStickerSuccess}
        />
      )}
    </>
  );
});