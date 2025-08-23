/**
 * GraphQL subgraph configuration and queries for the Stickernet miniapp
 *
 * This file contains all GraphQL queries, endpoints, and API configurations
 * to maintain a clean separation between business logic and API layer.
 */

import type { Curate } from "@/types";
export type { Curate };

// ===== API ENDPOINTS =====

/**
 * The Graph subgraph URL for Wavefront data
 */
export const SUBGRAPH_URL =
  "https://gateway.thegraph.com/api/subgraphs/id/6wxyMZKxnNByx3WDzeBkWFF3D5YoVzE3DkvyCvuojHrZ";

/**
 * The Graph API Key for authenticated requests
 */
export const GRAPH_API_KEY = process.env.GRAPH_API_KEY;

// ===== GRAPHQL QUERIES =====

/**
 * GraphQL query to fetch curates with pagination
 * Returns curates ordered by timestamp (newest first)
 */
export const GET_CURATES_QUERY = `
  query GetCurates($first: Int, $skip: Int) {
    curates(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
      id
      tokenId
      uri
      timestamp
      blockNumber
      price
      surplus
      creator {
        id
      }
      prevOwner {
        id
      }
      user {
        id
      }
      token {
        id
        name
        symbol
        uri
      }
    }
  }
`;

/**
 * GraphQL query to fetch a specific curate by ID
 */
export const GET_CURATE_BY_ID_QUERY = `
  query GetCurateById($id: String!) {
    curate(id: $id) {
      id
      tokenId
      uri
      timestamp
      blockNumber
      price
      surplus
      creator {
        id
      }
      prevOwner {
        id
      }
      user {
        id
      }
      token {
        id
        name
        symbol
        uri
      }
    }
  }
`;

/**
 * GraphQL query to fetch curates by creator
 */
export const GET_CURATES_BY_CREATOR_QUERY = `
  query GetCuratesByCreator($creator: String!, $first: Int, $skip: Int) {
    curates(
      where: { creator: $creator }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      tokenId
      uri
      timestamp
      blockNumber
      price
      surplus
      creator {
        id
      }
      prevOwner {
        id
      }
      user {
        id
      }
      token {
        id
        name
        symbol
        uri
      }
    }
  }
`;

/**
 * GraphQL query to fetch token information
 */
export const GET_TOKEN_QUERY = `
  query GetToken($id: String!) {
    token(id: $id) {
      id
      name
      symbol
      uri
      owner {
        id
      }
      isModerated
      marketPrice
      floorPrice
      liquidity
      marketCap
    }
  }
`;

/**
 * GraphQL query to fetch all tokens sorted by market cap
 */
export const GET_TOKENS_QUERY = `
  query GetTokens($first: Int, $skip: Int, $orderBy: String, $orderDirection: String) {
    tokens(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      name
      symbol
      uri
      marketPrice
      floorPrice
      marketCap
      liquidity
      holders
      contents
      swapVolume
      curateVolume
      createdAtTimestamp
      owner {
        id
      }
    }
  }
`;

/**
 * GraphQL query to fetch trending tokens based on 24h volume
 */
export const GET_TRENDING_TOKENS_QUERY = `
  query GetTrendingTokens($first: Int, $skip: Int, $timestamp: BigInt) {
    tokenDayDatas(
      first: $first
      skip: $skip
      orderBy: volume
      orderDirection: desc
      where: { timestamp_gte: $timestamp }
    ) {
      token {
        id
        name
        symbol
        uri
        marketPrice
        floorPrice
        marketCap
        liquidity
        holders
        contents
        swapVolume
        curateVolume
        createdAtTimestamp
        owner {
          id
        }
      }
      volume
    }
  }
`;

/**
 * GraphQL query to fetch board data for a token
 * Includes content positions, daily volume, and price changes
 */
export const GET_TOKEN_BOARD_DATA_QUERY = `
  query GetTokenBoardData($id: String!) {
    token(id: $id) {
      id
      name
      symbol
      uri
      marketPrice
      floorPrice
      holders
      contents
      contentBalance
      creatorRewardsQuote
      curatorRewardsQuote
      holderRewardsQuote
      contentRevenueQuote
      contentRevenueToken
      owner {
        id
      }
      isModerated
      contentPositions(orderBy: price, orderDirection: desc) {
        id
        tokenId
        creator {
          id
        }
        owner {
          id
        }
        uri
        price
        nextPrice
        isApproved
      }
      contentDayData(orderBy: timestamp, orderDirection: desc, first: 1) {
        timestamp
        volume
        surplus
      }
      tokenDayData(orderBy: timestamp, orderDirection: desc, first: 2) {
        timestamp
        marketPrice
        floorPrice
        volume
      }
      tokenHourData(orderBy: timestamp, orderDirection: desc, first: 2) {
        timestamp
        marketPrice
        floorPrice
        volume
      }
    }
  }
`;

// ===== TYPE DEFINITIONS =====

/**
 * GraphQL query variables for pagination
 */
export interface PaginationVariables {
  first?: number;
  skip?: number;
}

/**
 * GraphQL query variables for fetching curates
 */
export interface GetCuratesVariables extends PaginationVariables {}

/**
 * GraphQL query variables for fetching curate by ID
 */
export interface GetCurateByIdVariables {
  id: string;
}

/**
 * GraphQL query variables for fetching curates by creator
 */
export interface GetCuratesByCreatorVariables extends PaginationVariables {
  creator: string;
}

/**
 * GraphQL query variables for fetching token
 */
export interface GetTokenVariables {
  id: string;
}

/**
 * GraphQL query variables for fetching tokens list
 */
export interface GetTokensVariables extends PaginationVariables {
  orderBy?: string;
  orderDirection?: string;
}

/**
 * GraphQL response wrapper
 */
export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: Array<string | number>;
  }>;
}

/**
 * Directory entity from subgraph
 */
export interface DirectoryEntity {
  id: string;
  index: string;
  txCount: string;
  swapVolume: string;
  liquidity: string;
  curateVolume: string;
  contents: string;
}

/**
 * User entity from subgraph
 */
export interface UserEntity {
  id: string;
  txCount: string;
  referrer?: {
    id: string;
  };
}

/**
 * Curate entity from subgraph
 */
export interface CurateEntity {
  id: string;
  tokenId: string;
  uri: string;
  timestamp: string;
  blockNumber: string;
  price: string;
  surplus: string;
  creator: {
    id: string;
  };
  prevOwner?: {
    id: string;
  };
  user?: {
    id: string;
  };
  token: {
    id: string;
    name: string;
    symbol: string;
    uri: string;
  };
}

/**
 * Token entity from subgraph
 */
export interface TokenEntity {
  id: string;
  name: string;
  symbol: string;
  uri: string;
  owner: {
    id: string;
  };
  txCount?: string;
  swapVolume?: string;
  liquidity?: string;
  totalSupply?: string;
  marketCap?: string;
  quoteVirtReserve?: string;
  quoteRealReserve?: string;
  tokenReserve?: string;
  marketPrice?: string;
  floorPrice?: string;
  contribution?: string;
  holders?: string;
  contents?: string;
  contentBalance?: string;
  curateVolume?: string;
  creatorRewardsQuote?: string;
  curatorRewardsQuote?: string;
  holderRewardsQuote?: string;
  treasuryRevenueQuote?: string;
  treasuryRevenueToken?: string;
  contentRevenueQuote?: string;
  contentRevenueToken?: string;
  createdAtTimestamp?: string;
  createdAtBlockNumber?: string;
  isModerated?: boolean;
}

/**
 * Response type for getCurates query
 */
export interface GetCuratesResponse {
  curates: CurateEntity[];
}

/**
 * Response type for getCurateById query
 */
export interface GetCurateByIdResponse {
  curate: CurateEntity | null;
}

/**
 * Response type for getCuratesByCreator query
 */
export interface GetCuratesByCreatorResponse {
  curates: CurateEntity[];
}

/**
 * Response type for getToken query
 */
export interface GetTokenResponse {
  token: TokenEntity | null;
}

/**
 * Response type for getTokens query
 */
export interface GetTokensResponse {
  tokens: TokenEntity[];
}

/**
 * Content position entity from subgraph
 */
export interface ContentPositionEntity {
  id: string;
  tokenId: string;
  token: {
    id: string;
  };
  creator: {
    id: string;
  };
  owner: {
    id: string;
  };
  uri: string;
  price: string;
  nextPrice: string;
  isApproved?: boolean;
}

/**
 * Token position entity from subgraph
 */
export interface TokenPositionEntity {
  id: string;
  token: {
    id: string;
  };
  user: {
    id: string;
  };
  contribution: string;
  balance: string;
  debt: string;
  contentBalance: string;
  creatorRevenueQuote: string;
  ownerRevenueQuote: string;
  affiliateRevenueQuote: string;
  affiliateRevenueToken: string;
  curatorRevenueQuote: string;
  curatorRevenueToken: string;
}

/**
 * Swap entity from subgraph
 */
export interface SwapEntity {
  id: string;
  token: {
    id: string;
  };
  user: {
    id: string;
  };
  blockNumber: string;
  timestamp: string;
  quoteIn: string;
  quoteOut: string;
  tokenIn: string;
  tokenOut: string;
  marketPrice: string;
  floorPrice: string;
}

/**
 * Moderator entity from subgraph
 */
export interface ModeratorEntity {
  id: string;
  user: {
    id: string;
  };
  token: {
    id: string;
  };
  isModerator: boolean;
}

/**
 * Sale entity from subgraph
 */
export interface SaleEntity {
  id: string;
  token: {
    id: string;
  };
}

/**
 * Content entity from subgraph
 */
export interface ContentEntity {
  id: string;
  token: {
    id: string;
  };
}

/**
 * Rewarder entity from subgraph
 */
export interface RewarderEntity {
  id: string;
  token: {
    id: string;
  };
}

/**
 * Content day data entity
 */
export interface ContentDayDataEntity {
  timestamp: string;
  volume: string;
  surplus: string;
}

/**
 * Token day data entity
 */
export interface TokenDayDataEntity {
  timestamp: string;
  marketPrice: string;
  floorPrice: string;
  volume: string;
}

/**
 * Token hour data entity
 */
export interface TokenHourDataEntity {
  timestamp: string;
  marketPrice: string;
  floorPrice: string;
  volume: string;
}

/**
 * Token minute data entity
 */
export interface TokenMinuteDataEntity {
  timestamp: string;
  marketPrice: string;
  floorPrice: string;
  volume: string;
}

/**
 * Content hour data entity
 */
export interface ContentHourDataEntity {
  timestamp: string;
  volume: string;
  surplus: string;
}

/**
 * Content minute data entity
 */
export interface ContentMinuteDataEntity {
  timestamp: string;
  volume: string;
  surplus: string;
}

/**
 * Token board data entity from subgraph
 */
export interface TokenBoardDataEntity {
  id: string;
  name: string;
  symbol: string;
  uri: string;
  marketPrice: string;
  floorPrice?: string;
  holders?: string;
  contents?: string;
  contentBalance?: string;
  creatorRewardsQuote?: string;
  curatorRewardsQuote?: string;
  holderRewardsQuote?: string;
  contentRevenueQuote?: string;
  contentRevenueToken?: string;
  owner: {
    id: string;
  };
  isModerated?: boolean;
  contentPositions: ContentPositionEntity[];
  contentDayData: ContentDayDataEntity[];
  tokenDayData: TokenDayDataEntity[];
  tokenHourData?: TokenHourDataEntity[];
}

/**
 * Response type for getTokenBoardData query
 */
export interface GetTokenBoardDataResponse {
  token: TokenBoardDataEntity | null;
}

// ===== API FUNCTIONS =====

/**
 * Generic function to execute GraphQL queries
 */
export async function executeGraphQLQuery<
  TData = unknown,
  TVariables = Record<string, unknown>,
>(query: string, variables?: TVariables): Promise<GraphQLResponse<TData>> {
  try {
    // Always route through our Next.js API to avoid exposing API keys in the client bundle
    const response = await fetch("/api/subgraph", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Handle rate limiting more gracefully
      if (response.status === 429) {
        throw new Error(
          "Rate limit exceeded. Please try again in a few minutes.",
        );
      }

      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result: GraphQLResponse<TData> = await response.json();

    if (result.errors) {
      // Check for specific subgraph allocation issues
      const hasAllocationError = result.errors.some(
        (error) =>
          error.message.includes("subgraph not found") ||
          error.message.includes("no allocations"),
      );

      if (hasAllocationError) {
        throw new Error(
          "Subgraph is currently being indexed. Please try again in a few minutes.",
        );
      }

      throw new Error(
        `GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`,
      );
    }

    return result;
  } catch (error) {
    // More helpful error message
    if (error instanceof TypeError && error.message === "Failed to fetch") {
    }

    throw error;
  }
}

// ===== TRANSFORMATION FUNCTIONS =====

/**
 * Transform CurateEntity from subgraph to Curate for components
 */
export function transformCurateEntity(entity: CurateEntity): Curate {
  return {
    ...entity,
    tokenId: BigInt(entity.tokenId),
  };
}

/**
 * Transform multiple CurateEntity objects
 */
export function transformCurateEntities(entities: CurateEntity[]): Curate[] {
  return entities.map(transformCurateEntity);
}


/**
 * Fetch curates with pagination
 * Returns transformed curates ready for component use
 */
export async function fetchCurates(
  first: number = 50,
  skip: number = 0,
): Promise<Curate[]> {
  const result = await executeGraphQLQuery<
    GetCuratesResponse,
    GetCuratesVariables
  >(GET_CURATES_QUERY, { first, skip });

  const entities = result.data?.curates || [];
  return transformCurateEntities(entities);
}

/**
 * Fetch a specific curate by ID
 * Returns transformed curate ready for component use
 */
export async function fetchCurateById(id: string): Promise<Curate | null> {
  const result = await executeGraphQLQuery<
    GetCurateByIdResponse,
    GetCurateByIdVariables
  >(GET_CURATE_BY_ID_QUERY, { id });

  const entity = result.data?.curate;
  return entity ? transformCurateEntity(entity) : null;
}

/**
 * Fetch curates by creator
 * Returns transformed curates ready for component use
 */
export async function fetchCuratesByCreator(
  creator: string,
  first: number = 50,
  skip: number = 0,
): Promise<Curate[]> {
  const result = await executeGraphQLQuery<
    GetCuratesByCreatorResponse,
    GetCuratesByCreatorVariables
  >(GET_CURATES_BY_CREATOR_QUERY, { creator, first, skip });

  const entities = result.data?.curates || [];
  return transformCurateEntities(entities);
}

/**
 * Fetch token information
 */
export async function fetchToken(id: string): Promise<TokenEntity | null> {
  const result = await executeGraphQLQuery<GetTokenResponse, GetTokenVariables>(
    GET_TOKEN_QUERY,
    { id },
  );

  return result.data?.token || null;
}

/**
 * Fetch all tokens with pagination and sorting
 */
export async function fetchTokens(
  first: number = 50,
  skip: number = 0,
  orderBy: string = "marketCap",
  orderDirection: string = "desc",
): Promise<TokenEntity[]> {
  const result = await executeGraphQLQuery<
    GetTokensResponse,
    GetTokensVariables
  >(GET_TOKENS_QUERY, { first, skip, orderBy, orderDirection });

  return result.data?.tokens || [];
}

/**
 * Fetch trending tokens based on 24h volume
 */
export async function fetchTrendingTokens(
  first: number = 50,
  skip: number = 0,
): Promise<TokenEntity[]> {
  // Get timestamp for 24 hours ago
  const timestamp24hAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

  interface TrendingResponse {
    tokenDayDatas: Array<{
      token: TokenEntity;
      volume: string;
    }>;
  }

  interface TrendingVariables {
    first: number;
    skip: number;
    timestamp: string;
  }

  const result = await executeGraphQLQuery<TrendingResponse, TrendingVariables>(
    GET_TRENDING_TOKENS_QUERY,
    { first, skip, timestamp: timestamp24hAgo.toString() },
  );

  // Extract just the token entities from the response
  return result.data?.tokenDayDatas?.map((td) => td.token) || [];
}

/**
 * Fetch token board data including content positions and daily stats
 */
export async function fetchTokenBoardData(
  id: string,
): Promise<TokenBoardDataEntity | null> {
  const result = await executeGraphQLQuery<
    GetTokenBoardDataResponse,
    GetTokenVariables
  >(GET_TOKEN_BOARD_DATA_QUERY, { id });

  return result.data?.token || null;
}

// ===== CONSTANTS =====

/**
 * Default pagination limit
 */
export const DEFAULT_FIRST = 50;

/**
 * Default skip value for pagination
 */
export const DEFAULT_SKIP = 0;

/**
 * Pagination limit for "load more" functionality
 */
export const LOAD_MORE_LIMIT = 20;

/**
 * Threshold for infinite scroll trigger (pixels from bottom)
 */
export const INFINITE_SCROLL_THRESHOLD = 1000;
