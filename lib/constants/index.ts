/**
 * Barrel exports for constants
 * 
 * This file provides convenient access to all constants, contracts, and configurations
 * from a single import location.
 */

// Re-export everything from contracts
export * from './contracts';

// Re-export everything from API
export * from '../api/subgraph';

// Re-export everything from data
export * from '../data/mockData';

// ===== COMMONLY USED COMBINATIONS =====

/**
 * All contract-related exports grouped together
 */
export {
  USDC_ADDRESS,
  USDC_ABI,
  USDC_CONTRACT,
  USDC_DECIMALS,
  MULTICALL_ADDRESS,
  MULTICALL_ABI,
  MULTICALL_CONTRACT,
  REWARD_DECIMALS,
  TEST_USDC_MINT_AMOUNT,
} from './contracts';

/**
 * All API-related exports grouped together
 */
export {
  SUBGRAPH_URL,
  GET_CURATES_QUERY,
  GET_CURATE_BY_ID_QUERY,
  GET_CURATES_BY_CREATOR_QUERY,
  GET_TOKEN_QUERY,
  fetchCurates,
  fetchCurateById,
  fetchCuratesByCreator,
  fetchToken,
  executeGraphQLQuery,
  transformCurateEntity,
  transformCurateEntities,
  DEFAULT_FIRST,
  DEFAULT_SKIP,
  LOAD_MORE_LIMIT,
  INFINITE_SCROLL_THRESHOLD,
} from '../api/subgraph';

/**
 * Re-export types for convenience
 */
export type { 
  Curate,
  CurateEntity,
  TokenEntity,
  GraphQLResponse,
  GetCuratesResponse,
  GetCurateByIdResponse,
  GetCuratesByCreatorResponse,
  GetTokenResponse
} from '../api/subgraph';

/**
 * All mock data exports grouped together
 */
export {
  NAV_ITEMS,
  INITIAL_TODOS,
  MOCK_CURATES,
  SKELETON_HEIGHTS,
  APP_FEATURES,
  TEST_ADDRESSES,
  TEST_TOKEN_ADDRESSES,
  generateMockCurates,
  getRandomMockCurates,
  generateTodoId,
} from '../data/mockData';