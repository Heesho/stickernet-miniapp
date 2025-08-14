import type { TransactionResponse, TransactionError } from "@coinbase/onchainkit/transaction";

export interface TransactionCardProps {
  className?: string;
}

export interface TransactionCall {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
}

export interface TransactionHandlers {
  onSuccess?: (response: TransactionResponse) => Promise<void> | void;
  onError?: (error: TransactionError) => void;
}

export interface TransactionConfig {
  calls: TransactionCall[];
  handlers: TransactionHandlers;
}