/**
 * Contract constants and ABIs for the Stickernet miniapp
 * 
 * This file contains all contract addresses, ABIs, and related constants
 * to maintain a clean separation between business logic and configuration data.
 */

// ===== CONTRACT ADDRESSES =====

/**
 * USDC contract address on Base Sepolia
 */
export const USDC_ADDRESS = '0x0113A749d4c3cb85ea0Bf3062b41C63acA669d2f' as const;

/**
 * Router contract address on Base Sepolia
 */
export const ROUTER_ADDRESS = '0xe475BcD039795aBdd5086F492198879FA6068938' as const;

/**
 * Multicall contract address for batched contract queries
 */
export const MULTICALL_ADDRESS = '0x3161BeEc360162c6dda803f7F4BC59Fc92117642' as const;

// ===== CONTRACT ABIS =====

/**
 * USDC contract ABI - ERC20 interface with mint functionality for testing
 */
export const USDC_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

/**
 * Router contract ABI
 */
export const ROUTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_core",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "affiliate",
        "type": "address"
      }
    ],
    "name": "Router__AffiliateSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "affiliate",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountQuoteIn",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountTokenOut",
        "type": "uint256"
      }
    ],
    "name": "Router__Buy",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "content",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Router__ContentCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "content",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Router__ContentCurated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "quote",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountQuote",
        "type": "uint256"
      }
    ],
    "name": "Router__Contribute",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sale",
        "type": "address"
      }
    ],
    "name": "Router__MarketOpened",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Router__Redeem",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "affiliate",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountTokenIn",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountQuoteOut",
        "type": "uint256"
      }
    ],
    "name": "Router__Sell",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "uri",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isPrivate",
        "type": "bool"
      }
    ],
    "name": "Router__TokenCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "account_Affiliate",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "affiliate",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountQuoteIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minAmountTokenOut",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expireTimestamp",
        "type": "uint256"
      }
    ],
    "name": "buy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountQuoteIn",
        "type": "uint256"
      }
    ],
    "name": "contribute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "core",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "uri",
        "type": "string"
      }
    ],
    "name": "createContent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "uri",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isPrivate",
        "type": "bool"
      }
    ],
    "name": "createToken",
    "outputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "curateContent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "getContentReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "rewardToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "notifyContentRewardAmount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "redeem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "affiliate",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountTokenIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minAmountQuoteOut",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expireTimestamp",
        "type": "uint256"
      }
    ],
    "name": "sell",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      }
    ],
    "name": "withdrawStuckTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

/**
 * Multicall contract ABI for batched contract queries
 */
export const MULTICALL_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "getContentData",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "price",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "nextPrice",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "rewardForDuration",
            type: "uint256"
          },
          {
            internalType: "address",
            name: "creator",
            type: "address"
          },
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            internalType: "string",
            name: "uri",
            type: "string"
          }
        ],
        internalType: "struct Multicall.ContentData",
        name: "data",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address"
      },
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "getTokenData",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "index",
            type: "uint256"
          },
          {
            internalType: "address",
            name: "token",
            type: "address"
          },
          {
            internalType: "address",
            name: "quote",
            type: "address"
          },
          {
            internalType: "address",
            name: "sale",
            type: "address"
          },
          {
            internalType: "address",
            name: "content",
            type: "address"
          },
          {
            internalType: "address",
            name: "rewarder",
            type: "address"
          },
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            internalType: "string",
            name: "name",
            type: "string"
          },
          {
            internalType: "string",
            name: "symbol",
            type: "string"
          },
          {
            internalType: "string",
            name: "uri",
            type: "string"
          },
          {
            internalType: "bool",
            name: "marketOpen",
            type: "bool"
          },
          {
            internalType: "uint256",
            name: "saleEnd",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "totalQuoteContributed",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "marketCap",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "liquidity",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "floorPrice",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "marketPrice",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "circulatingSupply",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "maxSupply",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "contentApr",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "accountQuoteBalance",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "accountTokenBalance",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "accountDebt",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "accountCredit",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "accountTransferrable",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "accountContributed",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "accountRedeemable",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "accountContentStaked",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "accountQuoteEarned",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "accountTokenEarned",
            type: "uint256"
          },
          {
            internalType: "enum Multicall.Phase",
            name: "phase",
            type: "uint8"
          }
        ],
        internalType: "struct Multicall.TokenData",
        name: "data",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

// ===== TYPE DEFINITIONS =====

/**
 * Type for contract addresses
 */
export type ContractAddress = `0x${string}`;

/**
 * Contract configuration object
 */
export interface ContractConfig {
  address: ContractAddress;
  abi: readonly unknown[];
}

// ===== CONTRACT CONFIGURATIONS =====

/**
 * USDC contract configuration
 */
export const USDC_CONTRACT: ContractConfig = {
  address: USDC_ADDRESS,
  abi: USDC_ABI,
} as const;

/**
 * Router contract configuration
 */
export const ROUTER_CONTRACT: ContractConfig = {
  address: ROUTER_ADDRESS,
  abi: ROUTER_ABI,
} as const;

/**
 * Multicall contract configuration
 */
export const MULTICALL_CONTRACT: ContractConfig = {
  address: MULTICALL_ADDRESS,
  abi: MULTICALL_ABI,
} as const;

// ===== CONSTANTS =====

/**
 * USDC token decimals
 */
export const USDC_DECIMALS = 6;

/**
 * Standard decimal places for rewards (18 decimals)
 */
export const REWARD_DECIMALS = 18;

/**
 * Test mint amount for USDC (1000 USDC)
 */
export const TEST_USDC_MINT_AMOUNT = '1000';