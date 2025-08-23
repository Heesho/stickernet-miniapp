// import { type PaymasterAndBundlerActions } from '@coinbase/onchainkit/transaction';

/**
 * Paymaster configuration for Base Smart Wallet gasless transactions
 * This enables sponsored transactions for the best UX
 */
export const paymasterConfig = {
  // Use Coinbase's paymaster service for Base
  paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL,

  // Sponsorship policy - customize based on your needs
  sponsorshipPolicy: {
    // Sponsor transactions up to certain gas limit
    maxGasLimit: "500000",

    // Sponsor for specific contract interactions
    allowedContracts: [
      process.env.NEXT_PUBLIC_MULTICALL_ADDRESS,
      process.env.NEXT_PUBLIC_USDC_ADDRESS,
    ].filter(Boolean),

    // Rate limiting per user
    maxTransactionsPerHour: 10,
    maxTransactionsPerDay: 50,
  },
};

/**
 * Check if transaction should be sponsored
 */
export function shouldSponsorTransaction(
  contractAddress: string,
  functionName: string,
  userAddress: string,
): boolean {
  // Always sponsor multicall operations (for reading data)
  if (contractAddress === process.env.NEXT_PUBLIC_MULTICALL_ADDRESS) {
    return true;
  }

  // Sponsor USDC minting for testing
  if (
    contractAddress === process.env.NEXT_PUBLIC_USDC_ADDRESS &&
    functionName === "mint"
  ) {
    return true;
  }

  // Sponsor curation operations
  if (functionName === "curate" || functionName === "stake") {
    return true;
  }

  return false;
}

interface PaymasterService {
  url: string;
}

/**
 * Get paymaster actions for transactions
 */
export function getPaymasterActions(): PaymasterService | undefined {
  if (!paymasterConfig.paymasterUrl) {
    console.warn(
      "Paymaster URL not configured - transactions will not be sponsored",
    );
    return undefined;
  }

  return {
    url: paymasterConfig.paymasterUrl,
  };
}
