import { useState, useEffect, useCallback } from "react";
import {
  PriceDataPoint,
  Timeframe,
} from "@/app/components/ui/RobinhoodChart/RobinhoodChart.types";
import { SUBGRAPH_URL, GRAPH_API_KEY } from "@/lib/api/subgraph";
import { useAsyncErrorHandler, type StandardError } from "./useErrorHandler";

// Type for the actual GraphQL response
interface GraphQLDataPoint {
  id: string;
  timestamp: string;
  marketPrice: string;
  floorPrice: string;
  volume?: string;
}

interface UseChartDataProps {
  tokenAddress: string;
  timeframe: Timeframe;
  enabled?: boolean;
}

interface UseChartDataReturn {
  data: PriceDataPoint[];
  loading: boolean;
  error: StandardError | null;
  hasError: boolean;
  refetch: () => void;
}

// Helper function to get time range in milliseconds for each timeframe
const getTimeRangeForTimeframe = (timeframe: Timeframe): number => {
  switch (timeframe) {
    case "LIVE":
      return 3600000; // 1 hour
    case "4H":
      return 14400000; // 4 hours
    case "1D":
      return 86400000; // 1 day
    case "1W":
      return 604800000; // 1 week
    case "1M":
      return 2592000000; // 30 days
    case "MAX":
      return Date.now(); // From beginning to now
    default:
      return 86400000; // 1 day
  }
};

// Helper function to calculate data points needed for each timeframe
const getDataPointsConfig = (
  timeframe: Timeframe,
): { dataType: string; maxPoints: number; useRecent?: boolean } => {
  switch (timeframe) {
    case "LIVE": // Get 60 most recent minute data points
      return {
        dataType: "minute",
        maxPoints: 60, // Exactly 60 points for LIVE
        useRecent: true, // Flag to get most recent data
      };
    case "4H": // Get 240 most recent minute data points (4 hours)
      return {
        dataType: "minute",
        maxPoints: 240, // 240 minutes = 4 hours
        useRecent: true, // Flag to get most recent data
      };
    case "1D": // Get 24 most recent hour data points
      return {
        dataType: "hour",
        maxPoints: 24, // 24 hours for 1D
        useRecent: true, // Get most recent hours
      };
    case "1W": // Get 168 most recent hour data points (7 days)
      return {
        dataType: "hour",
        maxPoints: 168, // 168 hours in a week
        useRecent: true,
      };
    case "1M": // Get 30 most recent day data points
      return {
        dataType: "day",
        maxPoints: 30, // 30 days for 1M
        useRecent: true,
      };
    case "MAX": // Get all available day data points
      return {
        dataType: "day",
        maxPoints: 365, // Up to 365 days
        useRecent: true,
      };
    default:
      return {
        dataType: "hour",
        maxPoints: 24,
        useRecent: true,
      };
  }
};

// GraphQL queries for different data types
const GET_TOKEN_MINUTE_DATA = `
  query GetTokenMinuteData($ids: [ID!]!) {
    tokenMinuteDatas(where: { id_in: $ids }) {
      id
      timestamp
      marketPrice
      floorPrice
      volume
    }
  }
`;

const GET_TOKEN_HOUR_DATA_BY_IDS = `
  query GetTokenHourData($ids: [ID!]!) {
    tokenHourDatas(where: { id_in: $ids }) {
      id
      timestamp
      marketPrice
      floorPrice
      volume
    }
  }
`;

const GET_TOKEN_DAY_DATA_BY_IDS = `
  query GetTokenDayData($ids: [ID!]!) {
    tokenDayDatas(where: { id_in: $ids }) {
      id
      timestamp
      marketPrice
      floorPrice
      volume
    }
  }
`;

// Query to get the most recent minute data points
const GET_RECENT_TOKEN_MINUTE_DATA = `
  query GetRecentTokenMinuteData($token: ID!, $first: Int!) {
    token(id: $token) {
      tokenMinuteData(
        orderBy: timestamp
        orderDirection: desc
        first: $first
      ) {
        timestamp
        marketPrice
        floorPrice
        volume
      }
    }
  }
`;

// Query to get the most recent hour data points
const GET_RECENT_TOKEN_HOUR_DATA = `
  query GetRecentTokenHourData($token: ID!, $first: Int!) {
    token(id: $token) {
      tokenHourData(
        orderBy: timestamp
        orderDirection: desc
        first: $first
      ) {
        timestamp
        marketPrice
        floorPrice
        volume
      }
    }
  }
`;

// Query to get the most recent day data points
const GET_RECENT_TOKEN_DAY_DATA = `
  query GetRecentTokenDayData($token: ID!, $first: Int!) {
    token(id: $token) {
      tokenDayData(
        orderBy: timestamp
        orderDirection: desc
        first: $first
      ) {
        timestamp
        marketPrice
        floorPrice
        volume
      }
    }
  }
`;

const GET_TOKEN_HOUR_DATA = `
  query GetTokenHourData($token: ID!, $since: BigInt!, $first: Int!) {
    token(id: $token) {
      tokenHourData(
        where: { timestamp_gte: $since }
        orderBy: timestamp
        orderDirection: asc
        first: $first
      ) {
        timestamp
        marketPrice
        floorPrice
        volume
      }
    }
  }
`;

const GET_TOKEN_DAY_DATA = `
  query GetTokenDayData($token: ID!, $since: BigInt!, $first: Int!) {
    token(id: $token) {
      tokenDayData(
        where: { timestamp_gte: $since }
        orderBy: timestamp
        orderDirection: asc
        first: $first
      ) {
        timestamp
        marketPrice
        floorPrice
        volume
      }
    }
  }
`;

const GET_TOKEN_INFO = `
  query GetTokenInfo($token: ID!) {
    token(id: $token) {
      id
      createdAtTimestamp
      marketPrice
      floorPrice
    }
  }
`;

export function useChartData({
  tokenAddress,
  timeframe,
  enabled = true,
}: UseChartDataProps): UseChartDataReturn {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const errorHandler = useAsyncErrorHandler({
    hookName: "useChartData",
    showToast: false, // Don't show toast for chart data errors
    enableLogging: true,
    customErrorMapper: (error: unknown) => {
      // Map specific API errors
      const errorObj = error as { message?: string };
      if (errorObj?.message?.includes("GraphQL")) {
        return {
          category: "api" as const,
          severity: "medium" as const,
          userMessage: "Chart data temporarily unavailable",
          recoverySuggestion: "Chart data will refresh automatically.",
          retryable: true,
        };
      }

      if (
        errorObj?.message?.includes("fetch") ||
        errorObj?.message?.includes("network")
      ) {
        return {
          category: "network" as const,
          severity: "medium" as const,
          userMessage: "Unable to load chart data",
          recoverySuggestion: "Check your connection and try refreshing.",
          retryable: true,
        };
      }

      return {
        context: {
          tokenAddress,
          timeframe,
          enabled,
        },
      };
    },
  });

  const fetchChartData = useCallback(async () => {
    if (!enabled || !tokenAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    errorHandler.clearError();

    const result = await errorHandler.executeWithErrorHandling(
      async () => {
        const token = tokenAddress.toLowerCase(); // Token ID must be lowercase for subgraph

        // First get token info to know the current price
        const tokenInfoResponse = await fetch("/api/subgraph", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: GET_TOKEN_INFO,
            variables: { token },
          }),
        });

        const tokenInfoResult = await tokenInfoResponse.json();

        if (tokenInfoResult.errors) {
          console.error("GraphQL errors:", tokenInfoResult.errors);
        }

        const tokenInfo = tokenInfoResult.data?.token;

        if (!tokenInfo) {
          setData([]);
          setLoading(false);
          return;
        }

        const currentPrice = parseFloat(tokenInfo.marketPrice || "0");
        const currentFloorPrice = parseFloat(tokenInfo.floorPrice || "0");
        const tokenCreatedAt = parseInt(tokenInfo.createdAtTimestamp || "0");

        // Get config
        const config = getDataPointsConfig(timeframe);

        // Handle LIVE and 4H timeframes (minute data)
        if (timeframe === "LIVE" || timeframe === "4H") {
          const now = Math.floor(Date.now() / 1000);
          const currentMinuteIndex = Math.floor(now / 60);

          // Construct IDs based on timeframe
          const numMinutes = timeframe === "LIVE" ? 60 : 240; // 1 hour or 4 hours
          const minuteIds: string[] = [];
          for (let i = 0; i < numMinutes; i++) {
            const minuteIndex = currentMinuteIndex - i;
            minuteIds.push(`${token}-${minuteIndex}`);
          }

          console.log("Minute data query details:", {
            now: new Date(now * 1000).toLocaleString(),
            currentMinuteIndex,
            numMinutes,
            currentPrice,
            sampleIds: minuteIds.slice(0, 3),
          });

          // Query for specific minute data IDs
          const response = await fetch("/api/subgraph", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: GET_TOKEN_MINUTE_DATA,
              variables: {
                ids: minuteIds,
              },
            }),
          });

          const result = await response.json();

          if (result.errors) {
            console.error("Chart GraphQL errors:", result.errors);
          }

          const minuteData = result.data?.tokenMinuteDatas || [];

          console.log("Minute data query results:", {
            idsRequested: minuteIds.length,
            dataPointsReceived: minuteData.length,
            currentPrice,
            firstPoint: minuteData[0],
            lastPoint: minuteData[minuteData.length - 1],
          });

          // Process data - fill in missing minutes
          const startTime = now - numMinutes * 60; // Start time based on timeframe
          const processedData =
            timeframe === "LIVE"
              ? processLiveChartData(
                  minuteData,
                  currentPrice,
                  currentFloorPrice,
                  startTime,
                  now,
                )
              : process4HChartData(
                  minuteData,
                  currentPrice,
                  currentFloorPrice,
                  startTime,
                  now,
                );

          setData(processedData);
        } else if (timeframe === "1D" || timeframe === "1W") {
          // Handle 1D and 1W timeframes using hour data
          const now = Math.floor(Date.now() / 1000);
          const currentHourIndex = Math.floor(now / 3600);

          // Determine number of hours based on timeframe
          const numHours = timeframe === "1D" ? 24 : 168; // 24 hours for 1D, 168 hours for 1W

          // Construct hour IDs - only from token creation onwards
          const hourIds: string[] = [];
          const tokenCreatedHourIndex = Math.floor(tokenCreatedAt / 3600);
          const startHourIndex = Math.max(
            tokenCreatedHourIndex,
            currentHourIndex - (numHours - 1),
          );

          for (let i = startHourIndex; i <= currentHourIndex; i++) {
            hourIds.push(`${token}-${i}`);
          }

          console.log("Hour data query details:", {
            now: new Date(now * 1000).toLocaleString(),
            currentHourIndex,
            numHours,
            tokenCreatedAt: new Date(tokenCreatedAt * 1000).toLocaleString(),
            actualHoursToFetch: hourIds.length,
            currentPrice,
            sampleIds: hourIds.slice(0, 3),
          });

          // Query for specific hour data IDs
          const response = await fetch("/api/subgraph", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: GET_TOKEN_HOUR_DATA_BY_IDS,
              variables: {
                ids: hourIds,
              },
            }),
          });

          const result = await response.json();

          if (result.errors) {
            console.error(`${timeframe} chart GraphQL errors:`, result.errors);
          }

          const hourData = result.data?.tokenHourDatas || [];

          console.log("Hour data query results:", {
            idsRequested: hourIds.length,
            dataPointsReceived: hourData.length,
            currentPrice,
            firstPoint: hourData[0],
            lastPoint: hourData[hourData.length - 1],
          });

          // Process data based on timeframe - always use full timeframe period
          const startTime =
            timeframe === "1D" ? now - 24 * 3600 : now - 168 * 3600; // Full week

          const processedData =
            timeframe === "1D"
              ? process1DChartData(
                  hourData,
                  currentPrice,
                  currentFloorPrice,
                  startTime,
                  now,
                )
              : process1WChartData(
                  hourData,
                  currentPrice,
                  currentFloorPrice,
                  startTime,
                  now,
                  tokenCreatedAt,
                );

          setData(processedData);
        } else if (timeframe === "1M") {
          // Handle 1M timeframe using day data
          const now = Math.floor(Date.now() / 1000);
          const currentDayIndex = Math.floor(now / 86400); // 86400 seconds in a day

          // Construct day IDs - only from token creation onwards
          const dayIds: string[] = [];
          const tokenCreatedDayIndex = Math.floor(tokenCreatedAt / 86400);
          const startDayIndex = Math.max(
            tokenCreatedDayIndex,
            currentDayIndex - 29,
          ); // Up to 30 days

          for (let i = startDayIndex; i <= currentDayIndex; i++) {
            dayIds.push(`${token}-${i}`);
          }

          console.log("Day data query details:", {
            now: new Date(now * 1000).toLocaleString(),
            currentDayIndex,
            tokenCreatedAt: new Date(tokenCreatedAt * 1000).toLocaleString(),
            actualDaysToFetch: dayIds.length,
            currentPrice,
            sampleIds: dayIds.slice(0, 3),
          });

          // Query for specific day data IDs
          const response = await fetch("/api/subgraph", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: GET_TOKEN_DAY_DATA_BY_IDS,
              variables: {
                ids: dayIds,
              },
            }),
          });

          const result = await response.json();

          if (result.errors) {
            console.error("1M chart GraphQL errors:", result.errors);
          }

          const dayData = result.data?.tokenDayDatas || [];

          console.log("Day data query results:", {
            idsRequested: dayIds.length,
            dataPointsReceived: dayData.length,
            currentPrice,
            firstPoint: dayData[0],
            lastPoint: dayData[dayData.length - 1],
          });

          // Process 1M data - always use full month period
          const monthAgoTimestamp = now - 30 * 86400;
          const processedData = process1MChartData(
            dayData,
            currentPrice,
            currentFloorPrice,
            monthAgoTimestamp,
            now,
            tokenCreatedAt,
          );

          setData(processedData);
        } else if (timeframe === "MAX") {
          // Handle MAX timeframe - show entire token history
          const now = Math.floor(Date.now() / 1000);
          const tokenAge = now - tokenCreatedAt;

          // Decide which data type to use based on token age
          // If < 1 hour old, use minute data
          // If < 7 days old, use hour data
          // If < 90 days old, use day data
          // Otherwise, use day data but sample more sparsely

          let processedData: PriceDataPoint[] = [];

          if (tokenAge < 3600) {
            // Token is less than 1 hour old - use minute data
            const currentMinuteIndex = Math.floor(now / 60);
            const tokenCreatedMinuteIndex = Math.floor(tokenCreatedAt / 60);

            const minuteIds: string[] = [];
            for (let i = tokenCreatedMinuteIndex; i <= currentMinuteIndex; i++) {
              minuteIds.push(`${token}-${i}`);
            }

            console.log("MAX chart minute data query details:", {
              tokenAge: tokenAge / 60,
              minutesToFetch: minuteIds.length,
              currentPrice,
            });

            const response = await fetch("/api/subgraph", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: GET_TOKEN_MINUTE_DATA,
                variables: { ids: minuteIds },
              }),
            });

            const result = await response.json();
            if (result.errors) {
              console.error("MAX chart GraphQL errors:", result.errors);
            }

            const minuteData = result.data?.tokenMinuteDatas || [];
            
            // For very young tokens, always create at least 2 points
            if (minuteData.length === 0 || tokenAge < 60) {
              // Create a simple line from creation to now
              processedData = [
                {
                  timestamp: tokenCreatedAt * 1000,
                  marketPrice: currentPrice, // Use current price as starting price
                  floorPrice: currentFloorPrice,
                  volume: 0,
                },
                {
                  timestamp: now * 1000,
                  marketPrice: currentPrice,
                  floorPrice: currentFloorPrice,
                  volume: 0,
                },
              ];
            } else {
              processedData = processMAXChartData(
                minuteData,
                currentPrice,
                currentFloorPrice,
                tokenCreatedAt,
                now,
                "minute",
              );
            }
          } else if (tokenAge < 7 * 86400) {
            // Token is less than 7 days old - use hour data
            const currentHourIndex = Math.floor(now / 3600);
            const tokenCreatedHourIndex = Math.floor(tokenCreatedAt / 3600);

            const hourIds: string[] = [];
            for (let i = tokenCreatedHourIndex; i <= currentHourIndex; i++) {
              hourIds.push(`${token}-${i}`);
            }

            console.log("MAX chart hour data query details:", {
              tokenAge: tokenAge / 86400,
              hoursToFetch: hourIds.length,
              currentPrice,
            });

            const response = await fetch("/api/subgraph", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: GET_TOKEN_HOUR_DATA_BY_IDS,
                variables: { ids: hourIds },
              }),
            });

            const result = await response.json();
            if (result.errors) {
              console.error("MAX chart GraphQL errors:", result.errors);
            }

            const hourData = result.data?.tokenHourDatas || [];
            processedData = processMAXChartData(
              hourData,
              currentPrice,
              currentFloorPrice,
              tokenCreatedAt,
              now,
              "hour",
            );
          } else {
            // Token is older - use day data
            const currentDayIndex = Math.floor(now / 86400);
            const tokenCreatedDayIndex = Math.floor(tokenCreatedAt / 86400);

            const dayIds: string[] = [];
            for (let i = tokenCreatedDayIndex; i <= currentDayIndex; i++) {
              dayIds.push(`${token}-${i}`);
            }

            console.log("MAX chart day data query details:", {
              tokenAge: tokenAge / 86400,
              daysToFetch: dayIds.length,
              currentPrice,
            });

            const response = await fetch("/api/subgraph", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: GET_TOKEN_DAY_DATA_BY_IDS,
                variables: { ids: dayIds },
              }),
            });

            const result = await response.json();
            if (result.errors) {
              console.error("MAX chart GraphQL errors:", result.errors);
            }

            const dayData = result.data?.tokenDayDatas || [];
            processedData = processMAXChartData(
              dayData,
              currentPrice,
              currentFloorPrice,
              tokenCreatedAt,
              now,
              "day",
            );
          }

          setData(processedData);
        } else {
          // Handle other timeframes
          let query = "";
          let dataKey = "";

          if (config.useRecent) {
            // Use the "most recent" queries
            if (config.dataType === "minute") {
              query = GET_RECENT_TOKEN_MINUTE_DATA;
              dataKey = "tokenMinuteData";
            } else if (config.dataType === "hour") {
              query = GET_RECENT_TOKEN_HOUR_DATA;
              dataKey = "tokenHourData";
            } else {
              query = GET_RECENT_TOKEN_DAY_DATA;
              dataKey = "tokenDayData";
            }

            // Fetch the most recent data
            const response = await fetch("/api/subgraph", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query,
                variables: {
                  token,
                  first: config.maxPoints,
                },
              }),
            });

            const result = await response.json();

            if (result.errors) {
              console.error(`${dataKey} GraphQL errors:`, result.errors);
            }

            let rawData = result.data?.token?.[dataKey] || [];

            // Reverse the data since it comes in descending order
            rawData = rawData.reverse();

            console.log("MAX chart data query results:", {
              dataType: config.dataType,
              requestedPoints: config.maxPoints,
              receivedPoints: rawData.length,
              firstPoint: rawData[0],
              lastPoint: rawData[rawData.length - 1],
            });

            // Process the data
            const processedData = processChartData(
              rawData,
              currentPrice,
              currentFloorPrice,
              timeframe,
            );
            setData(processedData);
          } else {
            // Legacy path for time-based queries (not used anymore)
            console.error("Time-based queries not implemented in new version");
            setData([]);
          }
        }
        // Data processing is now handled in the query section above
        return true; // Return success
      },
      {
        operation: "fetch_chart_data",
        tokenAddress,
        timeframe,
      },
    );

    setLoading(false);

    if (!result) {
      // Error was handled by errorHandler
      setData([]);
    }
  }, [tokenAddress, timeframe, enabled, errorHandler]);

  // Process MAX chart data - intelligently samples to ~100 points
  const processMAXChartData = (
    data: GraphQLDataPoint[],
    currentPrice: number,
    currentFloorPrice: number,
    tokenCreatedAt: number,
    endTimestamp: number,
    dataType: "minute" | "hour" | "day",
  ): PriceDataPoint[] => {
    console.log("Processing MAX chart data:", {
      dataCount: data.length,
      dataType,
      currentPrice,
      tokenCreatedAt: new Date(tokenCreatedAt * 1000).toLocaleString(),
      endTime: new Date(endTimestamp * 1000).toLocaleString(),
    });

    const result: PriceDataPoint[] = [];
    const TARGET_POINTS = 100; // Aim for about 100 points

    // Create a map of existing data points
    const dataMap = new Map<number, GraphQLDataPoint>();
    const divisor = dataType === "minute" ? 60 : dataType === "hour" ? 3600 : 86400;

    data.forEach((point) => {
      const index = Math.floor(parseInt(point.timestamp) / divisor);
      dataMap.set(index, point);
    });

    // Calculate range
    const startIndex = Math.floor(tokenCreatedAt / divisor);
    const endIndex = Math.floor(endTimestamp / divisor);
    const totalPeriods = endIndex - startIndex + 1;

    // Calculate sampling interval to get approximately TARGET_POINTS
    const sampleInterval = Math.max(
      1,
      Math.floor(totalPeriods / TARGET_POINTS),
    );
    const actualPoints = Math.ceil(totalPeriods / sampleInterval);
    console.log("MAX chart sampling details:", {
      totalPeriods,
      sampleInterval,
      actualPoints,
    });

    // Start with current price as baseline for new tokens
    let lastKnownPrice = currentPrice;
    let lastKnownFloorPrice = currentFloorPrice;
    let hasSeenData = false;

    // Find first real data point
    for (let i = startIndex; i <= endIndex; i++) {
      if (dataMap.has(i)) {
        const point = dataMap.get(i);
        if (point) {
          lastKnownPrice = parseFloat(point.marketPrice);
          lastKnownFloorPrice = parseFloat(point.floorPrice);
          hasSeenData = true;
          break;
        }
      }
    }

    // Sample the data
    for (let i = 0; i < actualPoints; i++) {
      const periodOffset = i * sampleInterval;
      const periodIndex = startIndex + periodOffset;

      // Don't go past current time
      if (periodIndex > endIndex) break;

      const timestamp = periodIndex * divisor * 1000; // Convert to milliseconds

      // Look for data within the sample interval
      let foundData = false;
      for (let j = 0; j < sampleInterval && periodIndex + j <= endIndex; j++) {
        const checkIndex = periodIndex + j;
        if (dataMap.has(checkIndex)) {
          const point = dataMap.get(checkIndex);
          if (point) {
            lastKnownPrice = parseFloat(point.marketPrice);
            lastKnownFloorPrice = parseFloat(point.floorPrice);
            hasSeenData = true;

            result.push({
              timestamp,
              marketPrice: lastKnownPrice,
              floorPrice: lastKnownFloorPrice,
              volume: parseFloat(point.volume || "0"),
            });
            foundData = true;
            break;
          }
        }
      }

      if (!foundData) {
        // Use last known price or current price if we haven't seen any data yet
        const priceToUse = hasSeenData ? lastKnownPrice : currentPrice;
        const floorToUse = hasSeenData ? lastKnownFloorPrice : currentFloorPrice;

        result.push({
          timestamp,
          marketPrice: priceToUse,
          floorPrice: floorToUse,
          volume: 0,
        });
      }
    }

    // Make sure the last point reflects the current price
    if (result.length > 0) {
      // Add current price as final point if not already at current time
      const lastTimestamp = result[result.length - 1].timestamp;
      const nowTimestamp = Date.now();

      if (Math.abs(nowTimestamp - lastTimestamp) > divisor * 1000) {
        result.push({
          timestamp: nowTimestamp,
          marketPrice: currentPrice,
          floorPrice: currentFloorPrice,
          volume: 0,
        });
      } else {
        result[result.length - 1].marketPrice = currentPrice;
        result[result.length - 1].floorPrice = currentFloorPrice;
      }
    }

    console.log("MAX chart processing results:", {
      totalPoints: result.length,
      actualDataPoints: data.length,
      firstPoint: result[0],
      lastPoint: result[result.length - 1],
      currentPrice,
    });

    return result;
  };

  // Process 1M chart data - fills in missing day points with baseline price for pre-creation period
  const process1MChartData = (
    dayData: GraphQLDataPoint[],
    currentPrice: number,
    currentFloorPrice: number,
    startTimestamp: number,
    endTimestamp: number,
    tokenCreatedAt: number,
  ): PriceDataPoint[] => {
    console.log("Processing 1M chart data:", {
      dayDataCount: dayData.length,
      currentPrice,
      startTime: new Date(startTimestamp * 1000).toLocaleString(),
      endTime: new Date(endTimestamp * 1000).toLocaleString(),
      tokenCreatedAt: new Date(tokenCreatedAt * 1000).toLocaleString(),
    });

    const result: PriceDataPoint[] = [];
    const BASELINE_PRICE = 0.0001; // Baseline price for pre-creation period

    // Create a map of existing data points by day index
    const dataMap = new Map<number, any>();
    dayData.forEach((point) => {
      const dayIndex = Math.floor(parseInt(point.timestamp) / 86400);
      dataMap.set(dayIndex, point);
    });

    // Always show full 30 days
    const monthAgoTimestamp = endTimestamp - 30 * 86400;
    const startDayIndex = Math.floor(monthAgoTimestamp / 86400);
    const currentDayIndex = Math.floor(endTimestamp / 86400);
    const tokenCreatedDayIndex = Math.floor(tokenCreatedAt / 86400);
    const totalDays = currentDayIndex - startDayIndex + 1;

    // Start with the first available price or baseline
    let lastKnownPrice = BASELINE_PRICE;
    let lastKnownFloorPrice = BASELINE_PRICE;
    let hasSeenRealData = false;

    // Process each day forward in time (all 30 days)
    for (let i = 0; i < totalDays; i++) {
      const dayIndex = startDayIndex + i;
      const dayTimestamp = dayIndex * 86400;

      // Check if this day is before token creation
      if (dayIndex < tokenCreatedDayIndex) {
        // Before token existed - use baseline price
        result.push({
          timestamp: dayTimestamp * 1000,
          marketPrice: BASELINE_PRICE,
          floorPrice: BASELINE_PRICE,
          volume: 0,
        });
      } else if (dataMap.has(dayIndex)) {
        // Use actual data if available
        const point = dataMap.get(dayIndex);
        if (point) {
          lastKnownPrice = parseFloat(point.marketPrice);
          lastKnownFloorPrice = parseFloat(point.floorPrice);
          hasSeenRealData = true;
        }

        result.push({
          timestamp: dayTimestamp * 1000,
          marketPrice: lastKnownPrice,
          floorPrice: lastKnownFloorPrice,
          volume: parseFloat(point.volume || "0"),
        });
      } else {
        // After creation but no data - forward fill with last known or baseline
        const priceToUse = hasSeenRealData ? lastKnownPrice : BASELINE_PRICE;
        const floorToUse = hasSeenRealData
          ? lastKnownFloorPrice
          : BASELINE_PRICE;

        result.push({
          timestamp: dayTimestamp * 1000,
          marketPrice: priceToUse,
          floorPrice: floorToUse,
          volume: 0,
        });
      }
    }

    // Make sure the last point reflects the current price
    if (result.length > 0) {
      result[result.length - 1].marketPrice = currentPrice;
      result[result.length - 1].floorPrice = currentFloorPrice;
    }

    console.log("1M chart processing results:", {
      totalPoints: result.length,
      actualDataPoints: dayData.length,
      totalDays,
      firstPoint: result[0],
      lastPoint: result[result.length - 1],
      currentPrice,
    });

    return result;
  };

  // Process 1W chart data - fills in missing hour points with baseline price for pre-creation period
  const process1WChartData = (
    hourData: GraphQLDataPoint[],
    currentPrice: number,
    currentFloorPrice: number,
    startTimestamp: number,
    endTimestamp: number,
    tokenCreatedAt: number,
  ): PriceDataPoint[] => {
    console.log("Processing 1W chart data:", {
      hourDataCount: hourData.length,
      currentPrice,
      startTime: new Date(startTimestamp * 1000).toLocaleString(),
      endTime: new Date(endTimestamp * 1000).toLocaleString(),
      tokenCreatedAt: new Date(tokenCreatedAt * 1000).toLocaleString(),
    });

    const result: PriceDataPoint[] = [];
    const BASELINE_PRICE = 0.0001; // Baseline price for pre-creation period

    // Create a map of existing data points by hour index
    const dataMap = new Map<number, any>();
    hourData.forEach((point) => {
      const hourIndex = Math.floor(parseInt(point.timestamp) / 3600);
      dataMap.set(hourIndex, point);
    });

    // Always show full week (168 hours)
    const weekAgoTimestamp = endTimestamp - 168 * 3600;
    const startHourIndex = Math.floor(weekAgoTimestamp / 3600);
    const currentHourIndex = Math.floor(endTimestamp / 3600);
    const tokenCreatedHourIndex = Math.floor(tokenCreatedAt / 3600);
    const totalHours = currentHourIndex - startHourIndex + 1;

    // We want approximately 42 points for the week (6 per day)
    const targetPoints = 42;
    const sampleInterval = Math.max(1, Math.floor(168 / targetPoints)); // Always based on full week

    // Start with baseline price
    let lastKnownPrice = BASELINE_PRICE;
    let lastKnownFloorPrice = BASELINE_PRICE;
    let hasSeenRealData = false;

    // Process sampled hours forward in time
    for (let i = 0; i < targetPoints; i++) {
      const hourOffset = i * sampleInterval;
      const hourIndex = startHourIndex + hourOffset;
      const hourTimestamp = hourIndex * 3600;

      // Check if this hour is before token creation
      if (hourIndex < tokenCreatedHourIndex) {
        // Before token existed - use baseline price
        result.push({
          timestamp: hourTimestamp * 1000,
          marketPrice: BASELINE_PRICE,
          floorPrice: BASELINE_PRICE,
          volume: 0,
        });
      } else {
        // Find the best data point within the sample interval
        let foundData = false;
        for (let j = 0; j < sampleInterval && !foundData; j++) {
          const checkIndex = hourIndex + j;
          if (dataMap.has(checkIndex)) {
            const point = dataMap.get(checkIndex);
            lastKnownPrice = parseFloat(point.marketPrice);
            lastKnownFloorPrice = parseFloat(point.floorPrice);
            hasSeenRealData = true;

            result.push({
              timestamp: hourTimestamp * 1000,
              marketPrice: lastKnownPrice,
              floorPrice: lastKnownFloorPrice,
              volume: parseFloat(point.volume || "0"),
            });
            foundData = true;
          }
        }

        if (!foundData) {
          // After creation but no data - forward fill with last known or baseline
          const priceToUse = hasSeenRealData ? lastKnownPrice : BASELINE_PRICE;
          const floorToUse = hasSeenRealData
            ? lastKnownFloorPrice
            : BASELINE_PRICE;

          result.push({
            timestamp: hourTimestamp * 1000,
            marketPrice: priceToUse,
            floorPrice: floorToUse,
            volume: 0,
          });
        }
      }
    }

    // Make sure the last point reflects the current price
    if (result.length > 0) {
      result[result.length - 1].marketPrice = currentPrice;
      result[result.length - 1].floorPrice = currentFloorPrice;
    }

    console.log("1W chart processing results:", {
      totalPoints: result.length,
      actualDataPoints: hourData.length,
      sampleInterval,
      firstPoint: result[0],
      lastPoint: result[result.length - 1],
      currentPrice,
    });

    return result;
  };

  // Process 1D chart data - fills in missing hour points with forward-filling
  const process1DChartData = (
    hourData: GraphQLDataPoint[],
    currentPrice: number,
    currentFloorPrice: number,
    startTimestamp: number,
    endTimestamp: number,
  ): PriceDataPoint[] => {
    console.log("Processing 1D chart data:", {
      hourDataCount: hourData.length,
      currentPrice,
      startTime: new Date(startTimestamp * 1000).toLocaleString(),
      endTime: new Date(endTimestamp * 1000).toLocaleString(),
    });

    const result: PriceDataPoint[] = [];

    // Create a map of existing data points by hour index
    const dataMap = new Map<number, any>();
    hourData.forEach((point) => {
      const hourIndex = Math.floor(parseInt(point.timestamp) / 3600);
      dataMap.set(hourIndex, point);
    });

    // Get current hour index and starting hour index
    const currentHourIndex = Math.floor(endTimestamp / 3600);
    const startHourIndex = currentHourIndex - 23; // 24 hours total (0-23)

    // Start with the first available price or current price if no data
    let lastKnownPrice = currentPrice;
    let lastKnownFloorPrice = currentFloorPrice;

    // Find the earliest data point to use as starting price if available
    let earliestDataPoint = null;
    for (let i = startHourIndex; i <= currentHourIndex; i++) {
      if (dataMap.has(i)) {
        earliestDataPoint = dataMap.get(i);
        lastKnownPrice = parseFloat(earliestDataPoint.marketPrice);
        lastKnownFloorPrice = parseFloat(earliestDataPoint.floorPrice);
        break;
      }
    }

    // If no historical data at all, use current price
    if (!earliestDataPoint && hourData.length === 0) {
      lastKnownPrice = currentPrice;
      lastKnownFloorPrice = currentFloorPrice;
    }

    // Process each hour forward in time (all 24 hours)
    for (let i = 0; i < 24; i++) {
      const hourIndex = startHourIndex + i;
      const hourTimestamp = hourIndex * 3600;

      if (dataMap.has(hourIndex)) {
        // Use actual data if available
        const point = dataMap.get(hourIndex);
        lastKnownPrice = parseFloat(point.marketPrice);
        lastKnownFloorPrice = parseFloat(point.floorPrice);

        result.push({
          timestamp: hourTimestamp * 1000, // Convert to milliseconds
          marketPrice: lastKnownPrice,
          floorPrice: lastKnownFloorPrice,
          volume: parseFloat(point.volume || "0"),
        });
      } else {
        // Use last known price (forward-filling)
        result.push({
          timestamp: hourTimestamp * 1000, // Convert to milliseconds
          marketPrice: lastKnownPrice,
          floorPrice: lastKnownFloorPrice,
          volume: 0,
        });
      }
    }

    // Make sure the last point reflects the current price
    if (result.length > 0) {
      result[result.length - 1].marketPrice = currentPrice;
      result[result.length - 1].floorPrice = currentFloorPrice;
    }

    console.log("1D chart processing results:", {
      totalPoints: result.length,
      actualDataPoints: hourData.length,
      firstPoint: result[0],
      lastPoint: result[result.length - 1],
      currentPrice,
    });

    return result;
  };

  // Process 4H chart data - fills in missing minute points with forward-filling
  const process4HChartData = (
    minuteData: GraphQLDataPoint[],
    currentPrice: number,
    currentFloorPrice: number,
    startTimestamp: number,
    endTimestamp: number,
  ): PriceDataPoint[] => {
    console.log("Processing 4H chart data:", {
      minuteDataCount: minuteData.length,
      currentPrice,
      startTime: new Date(startTimestamp * 1000).toLocaleString(),
      endTime: new Date(endTimestamp * 1000).toLocaleString(),
    });

    const result: PriceDataPoint[] = [];

    // Create a map of existing data points by minute index
    const dataMap = new Map<number, any>();
    minuteData.forEach((point) => {
      const minuteIndex = Math.floor(parseInt(point.timestamp) / 60);
      dataMap.set(minuteIndex, point);
    });

    // Get current minute index and starting minute index
    const currentMinuteIndex = Math.floor(endTimestamp / 60);
    const startMinuteIndex = currentMinuteIndex - 239; // 240 minutes total (0-239)

    // Start with the first available price or current price if no data
    let lastKnownPrice = currentPrice;
    let lastKnownFloorPrice = currentFloorPrice;

    // Find the earliest data point to use as starting price if available
    let earliestDataPoint = null;
    for (let i = startMinuteIndex; i <= currentMinuteIndex; i++) {
      if (dataMap.has(i)) {
        earliestDataPoint = dataMap.get(i);
        lastKnownPrice = parseFloat(earliestDataPoint.marketPrice);
        lastKnownFloorPrice = parseFloat(earliestDataPoint.floorPrice);
        break;
      }
    }

    // If no historical data at all, use current price
    if (!earliestDataPoint && minuteData.length === 0) {
      lastKnownPrice = currentPrice;
      lastKnownFloorPrice = currentFloorPrice;
    }

    // Process each minute forward in time
    // Sample every 4 minutes to get 60 points for the chart
    const sampleInterval = 4; // Sample every 4 minutes (240 / 60 = 4)
    for (let i = 0; i < 60; i++) {
      const sampleMinuteOffset = i * sampleInterval;
      const minuteIndex = startMinuteIndex + sampleMinuteOffset;
      const minuteTimestamp = minuteIndex * 60;

      // Find the closest data point within the sample interval
      let foundData = false;
      for (let j = 0; j < sampleInterval && !foundData; j++) {
        const checkIndex = minuteIndex + j;
        if (dataMap.has(checkIndex)) {
          const point = dataMap.get(checkIndex);
          lastKnownPrice = parseFloat(point.marketPrice);
          lastKnownFloorPrice = parseFloat(point.floorPrice);

          result.push({
            timestamp: minuteTimestamp * 1000, // Convert to milliseconds
            marketPrice: lastKnownPrice,
            floorPrice: lastKnownFloorPrice,
            volume: parseFloat(point.volume || "0"),
          });
          foundData = true;
        }
      }

      if (!foundData) {
        // Use last known price (forward-filling)
        result.push({
          timestamp: minuteTimestamp * 1000, // Convert to milliseconds
          marketPrice: lastKnownPrice,
          floorPrice: lastKnownFloorPrice,
          volume: 0,
        });
      }
    }

    // Make sure the last point reflects the current price
    if (result.length > 0) {
      result[result.length - 1].marketPrice = currentPrice;
      result[result.length - 1].floorPrice = currentFloorPrice;
    }

    console.log("4H chart processing results:", {
      totalPoints: result.length,
      actualDataPoints: minuteData.length,
      firstPoint: result[0],
      lastPoint: result[result.length - 1],
      currentPrice,
    });

    return result;
  };

  // Process LIVE chart data - fills in missing minute points with forward-filling
  const processLiveChartData = (
    minuteData: GraphQLDataPoint[],
    currentPrice: number,
    currentFloorPrice: number,
    startTimestamp: number,
    endTimestamp: number,
  ): PriceDataPoint[] => {
    console.log("Processing LIVE chart data:", {
      minuteDataCount: minuteData.length,
      currentPrice,
      startTime: new Date(startTimestamp * 1000).toLocaleTimeString(),
      endTime: new Date(endTimestamp * 1000).toLocaleTimeString(),
      sampleData: minuteData.slice(0, 3),
    });

    const result: PriceDataPoint[] = [];

    // Create a map of existing data points by minute index
    const dataMap = new Map<number, any>();
    minuteData.forEach((point) => {
      const minuteIndex = Math.floor(parseInt(point.timestamp) / 60);
      dataMap.set(minuteIndex, point);
    });

    // Get current minute index and starting minute index
    const currentMinuteIndex = Math.floor(endTimestamp / 60);
    const startMinuteIndex = currentMinuteIndex - 59; // 60 minutes total (0-59)

    // Check if we need variation (no data or all same price)
    const uniquePrices = new Set(
      minuteData.map((d) => parseFloat(d.marketPrice)),
    );
    const needsVariation = minuteData.length === 0 || uniquePrices.size <= 1;

    // Start with the first available price or current price if no data
    let lastKnownPrice = currentPrice;
    let lastKnownFloorPrice = currentFloorPrice;

    // Find the earliest data point to use as starting price if available
    let earliestDataPoint = null;
    for (let i = startMinuteIndex; i <= currentMinuteIndex; i++) {
      if (dataMap.has(i)) {
        earliestDataPoint = dataMap.get(i);
        lastKnownPrice = parseFloat(earliestDataPoint.marketPrice);
        lastKnownFloorPrice = parseFloat(earliestDataPoint.floorPrice);
        break;
      }
    }

    // If no historical data at all, use current price
    if (!earliestDataPoint && minuteData.length === 0) {
      lastKnownPrice = currentPrice;
      lastKnownFloorPrice = currentFloorPrice;
    }

    // Process each minute forward in time
    for (let i = 0; i < 60; i++) {
      const minuteIndex = startMinuteIndex + i;
      const minuteTimestamp = minuteIndex * 60;

      if (dataMap.has(minuteIndex)) {
        // Use actual data if available
        const point = dataMap.get(minuteIndex);
        lastKnownPrice = parseFloat(point.marketPrice);
        lastKnownFloorPrice = parseFloat(point.floorPrice);

        result.push({
          timestamp: minuteTimestamp * 1000, // Convert to milliseconds
          marketPrice: lastKnownPrice,
          floorPrice: lastKnownFloorPrice,
          volume: parseFloat(point.volume || "0"),
        });
      } else {
        // Use last known price (forward-filling)
        result.push({
          timestamp: minuteTimestamp * 1000, // Convert to milliseconds
          marketPrice: lastKnownPrice,
          floorPrice: lastKnownFloorPrice,
          volume: 0,
        });
      }
    }

    // Don't add any fake variation - keep the real data as is
    // The chart should show a flat line if there were no trades

    // Make sure the last point reflects the current price
    if (result.length > 0) {
      result[result.length - 1].marketPrice = currentPrice;
      result[result.length - 1].floorPrice = currentFloorPrice;
    }

    console.log("LIVE chart processing results:", {
      totalPoints: result.length,
      actualDataPoints: minuteData.length,
      filledPoints: 60 - minuteData.length,
      needsVariation,
      firstPoint: result[0],
      lastPoint: result[result.length - 1],
      currentPrice,
      priceRange: {
        min: Math.min(...result.map((p) => p.marketPrice)),
        max: Math.max(...result.map((p) => p.marketPrice)),
      },
    });

    return result;
  };

  // Process raw subgraph data into exactly 60 chart points
  const processChartData = (
    rawData: GraphQLDataPoint[],
    currentPrice: number,
    currentFloorPrice: number,
    timeframe: Timeframe,
  ): PriceDataPoint[] => {
    if (rawData.length === 0) {
      // If no historical data, create just 2 points to show current state
      // This avoids misleading flat lines that look like stable price
      const now = Date.now();
      const range = getTimeRangeForTimeframe(timeframe);
      const startTime = now - range;

      return [
        {
          timestamp: startTime,
          marketPrice: currentPrice,
          floorPrice: currentFloorPrice,
          volume: 0,
        },
        {
          timestamp: now,
          marketPrice: currentPrice,
          floorPrice: currentFloorPrice,
          volume: 0,
        },
      ];
    }

    // If we have only 1 data point, add current price as second point
    if (rawData.length === 1) {
      const singlePoint = rawData[0];
      const now = Date.now();
      return [
        {
          timestamp: parseInt(singlePoint.timestamp) * 1000,
          marketPrice: parseFloat(singlePoint.marketPrice),
          floorPrice: parseFloat(singlePoint.floorPrice),
          volume: parseFloat(singlePoint.volume || "0"),
        },
        {
          timestamp: now,
          marketPrice: currentPrice,
          floorPrice: currentFloorPrice,
          volume: 0,
        },
      ];
    }

    // Sort data by timestamp
    const sortedData = [...rawData].sort(
      (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
    );

    // Convert to PriceDataPoint format
    const dataPoints: PriceDataPoint[] = sortedData.map((item) => ({
      timestamp: parseInt(item.timestamp) * 1000, // Convert to milliseconds
      marketPrice: parseFloat(item.marketPrice || "0"),
      floorPrice: parseFloat(item.floorPrice || "0"),
      volume: parseFloat(item.volume || "0"),
    }));

    // Return the data points directly - no resampling needed
    return dataPoints;
  };

  // Resample data to exactly 60 points
  const resampleTo60Points = (
    data: PriceDataPoint[],
    timeframe: Timeframe,
  ): PriceDataPoint[] => {
    if (data.length === 0) return [];

    // If we have exactly 60 points, return as is
    if (data.length === 60) return data;

    // If we only have 1 point, create a flat line
    if (data.length === 1) {
      const singlePoint = data[0];
      const result: PriceDataPoint[] = [];
      const range = getTimeRangeForTimeframe(timeframe);
      const now = Date.now();
      const startTime = now - range;

      for (let i = 0; i < 60; i++) {
        result.push({
          timestamp: startTime + i * (range / 59),
          marketPrice: singlePoint.marketPrice,
          floorPrice: singlePoint.floorPrice,
          volume: i === 59 ? singlePoint.volume : 0,
        });
      }
      return result;
    }

    const result: PriceDataPoint[] = [];

    // If we have fewer than 60 points, we need to interpolate
    if (data.length < 60) {
      const firstPoint = data[0];
      const lastPoint = data[data.length - 1];
      const timeRange = lastPoint.timestamp - firstPoint.timestamp;
      const timeStep = timeRange / 59; // 60 points = 59 intervals

      let dataIndex = 0;
      for (let i = 0; i < 60; i++) {
        const targetTime = firstPoint.timestamp + timeStep * i;

        // Find the appropriate data point for this time
        while (
          dataIndex < data.length - 1 &&
          data[dataIndex + 1].timestamp <= targetTime
        ) {
          dataIndex++;
        }

        // Interpolate between points if we're between two data points
        if (dataIndex < data.length - 1) {
          const currentPoint = data[dataIndex];
          const nextPoint = data[dataIndex + 1];
          const timeFraction =
            (targetTime - currentPoint.timestamp) /
            (nextPoint.timestamp - currentPoint.timestamp);

          // Linear interpolation for smoother transitions
          result.push({
            timestamp: targetTime,
            marketPrice:
              currentPoint.marketPrice +
              (nextPoint.marketPrice - currentPoint.marketPrice) *
                Math.max(0, Math.min(1, timeFraction)),
            floorPrice:
              currentPoint.floorPrice +
              (nextPoint.floorPrice - currentPoint.floorPrice) *
                Math.max(0, Math.min(1, timeFraction)),
            volume: 0, // Only show volume on actual data points
          });
        } else {
          // Use the last known price for points beyond data
          const point = data[dataIndex];
          result.push({
            timestamp: targetTime,
            marketPrice: point.marketPrice,
            floorPrice: point.floorPrice,
            volume: i === 59 ? point.volume : 0,
          });
        }
      }
    } else {
      // If we have more than 60 points, sample evenly
      const step = (data.length - 1) / 59; // 60 points = 59 intervals

      for (let i = 0; i < 60; i++) {
        const index = Math.round(i * step);
        const point = data[Math.min(index, data.length - 1)];
        result.push(point);
      }
    }

    return result;
  };

  // Auto-refresh for LIVE timeframe
  useEffect(() => {
    fetchChartData();

    if (timeframe === "LIVE" && enabled) {
      const interval = setInterval(fetchChartData, 10000); // Refresh every 10 seconds for LIVE
      return () => clearInterval(interval);
    }
  }, [tokenAddress, timeframe, enabled]);

  return {
    data,
    loading,
    error: errorHandler.error,
    hasError: errorHandler.hasError,
    refetch: fetchChartData,
  };
}
