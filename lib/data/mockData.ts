/**
 * Mock data for the Stickernet miniapp
 * 
 * This file contains all mock data, test data, and development fixtures
 * to maintain a clean separation between business logic and test data.
 */


// ===== NAVIGATION DATA =====

/**
 * Navigation items for bottom navigation
 */
export const NAV_ITEMS = [
  { id: "home", icon: "home", label: "Home" },
  { id: "search", icon: "search", label: "Browse" },
  { id: "create", icon: "create", label: "Create" },
  { id: "notifications", icon: "notifications", label: "Activity" },
  { id: "profile", icon: "profile", label: "Profile" },
] as const;

/**
 * Type for navigation item IDs
 */
export type NavItemId = typeof NAV_ITEMS[number]['id'];

/**
 * Type for navigation item
 */
export interface NavItem {
  id: string;
  icon: string;
  label: string;
}


// ===== CURATE MOCK DATA =====

import type { Curate } from '@/types';

/**
 * Mock curates data for testing when API is unavailable
 */
export const MOCK_CURATES: Curate[] = [
  {
    id: 'tx-001-log-0',
    tokenId: BigInt(1),
    uri: 'https://picsum.photos/300/400?random=1',
    timestamp: '1640995200',
    price: '1.23',
    creator: {
      id: '0x1234567890abcdef'
    },
    token: {
      id: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      name: 'Cool Board',
      uri: 'https://picsum.photos/40/40?random=20'
    }
  },
  {
    id: 'tx-002-log-0', 
    tokenId: BigInt(2),
    uri: 'https://picsum.photos/300/500?random=2',
    timestamp: '1640995100',
    price: '2.45',
    creator: {
      id: '0xabcdef1234567890'
    },
    token: {
      id: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      name: 'Art Collection',
      uri: 'https://picsum.photos/40/40?random=21'
    }
  },
  {
    id: 'tx-003-log-0',
    tokenId: BigInt(3),
    uri: 'https://picsum.photos/300/350?random=3', 
    timestamp: '1640995000',
    price: '0.89',
    creator: {
      id: '0x9876543210fedcba'
    },
    token: {
      id: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      name: 'Meme Board',
      uri: 'https://picsum.photos/40/40?random=22'
    }
  },
  {
    id: 'tx-004-log-0',
    tokenId: BigInt(4),
    uri: 'https://picsum.photos/300/450?random=4',
    timestamp: '1640994900',
    price: '3.67',
    creator: {
      id: '0xfedcba0987654321'
    },
    token: {
      id: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      name: 'Cool Board',
      uri: 'https://picsum.photos/40/40?random=20'
    }
  },
  {
    id: 'tx-005-log-0',
    tokenId: BigInt(5),
    uri: 'https://picsum.photos/300/320?random=5',
    timestamp: '1640994800',
    price: '1.89',
    creator: {
      id: '0x1357924680abcdef'
    },
    token: {
      id: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      name: 'Art Collection',
      uri: 'https://picsum.photos/40/40?random=21'
    }
  },
  {
    id: 'tx-006-log-0',
    tokenId: BigInt(6),
    uri: 'https://picsum.photos/300/380?random=6',
    timestamp: '1640994700',
    price: '4.21',
    creator: {
      id: '0x2468135790fedcba'
    },
    token: {
      id: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      name: 'Meme Board',
      uri: 'https://picsum.photos/40/40?random=22'
    }
  }
];

// ===== SKELETON DATA =====

/**
 * Fixed skeleton heights for loading states to prevent hydration mismatch
 */
export const SKELETON_HEIGHTS = [280, 320, 240, 360, 300, 220, 340, 260, 380, 290];

// ===== DEMO FEATURES =====

/**
 * Feature list for demo purposes
 */
export interface Feature {
  icon: string;
  title: string;
  description: string;
}

/**
 * App features for marketing/demo purposes
 */
export const APP_FEATURES: Feature[] = [
  {
    icon: "check",
    title: "Minimalistic Design",
    description: "Minimalistic and beautiful UI design"
  },
  {
    icon: "check", 
    title: "Responsive Layout",
    description: "Responsive layout for all devices"
  },
  {
    icon: "check",
    title: "Dark Mode Support", 
    description: "Dark mode support"
  },
  {
    icon: "check",
    title: "OnchainKit Integration",
    description: "OnchainKit integration"
  }
];

// ===== TESTING CONSTANTS =====

/**
 * Test wallet addresses for development
 */
export const TEST_ADDRESSES = {
  creator1: '0x1234567890abcdef' as const,
  creator2: '0xabcdef1234567890' as const,
  creator3: '0x9876543210fedcba' as const,
  creator4: '0xfedcba0987654321' as const,
  creator5: '0x1357924680abcdef' as const,
  creator6: '0x2468135790fedcba' as const,
} as const;

/**
 * Test token addresses for development
 */
export const TEST_TOKEN_ADDRESSES = {
  coolBoard: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as const,
  artCollection: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const,
  memeBoard: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as const,
} as const;

// ===== UTILITY FUNCTIONS =====

/**
 * Generate additional mock curates for testing pagination
 */
export function generateMockCurates(count: number, startId: number = 100): Curate[] {
  const mockCurates: Curate[] = [];
  const creators = Object.values(TEST_ADDRESSES);
  const tokens = [
    { id: TEST_TOKEN_ADDRESSES.coolBoard, name: 'Cool Board', uri: 'https://picsum.photos/40/40?random=20' },
    { id: TEST_TOKEN_ADDRESSES.artCollection, name: 'Art Collection', uri: 'https://picsum.photos/40/40?random=21' },
    { id: TEST_TOKEN_ADDRESSES.memeBoard, name: 'Meme Board', uri: 'https://picsum.photos/40/40?random=22' },
  ];

  for (let i = 0; i < count; i++) {
    const id = startId + i;
    const creatorIndex = i % creators.length;
    const tokenIndex = i % tokens.length;
    const timestamp = (1640995200 - i * 100).toString();
    const price = (Math.random() * 5 + 0.5).toFixed(2);
    const imageVariant = (id % 50) + 1;

    mockCurates.push({
      id: `tx-${id.toString().padStart(3, '0')}-log-0`,
      tokenId: BigInt(id),
      uri: `https://picsum.photos/300/${300 + (i % 200)}?random=${imageVariant}`,
      timestamp,
      price,
      creator: {
        id: creators[creatorIndex]
      },
      token: tokens[tokenIndex]
    });
  }

  return mockCurates;
}

/**
 * Get a random subset of mock curates
 */
export function getRandomMockCurates(count: number): Curate[] {
  const allMockCurates = [...MOCK_CURATES, ...generateMockCurates(20)];
  const shuffled = allMockCurates.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

