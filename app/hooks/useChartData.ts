import { useState, useEffect, useCallback } from 'react';
import { PriceDataPoint, Timeframe } from '@/app/components/ui/RobinhoodChart/RobinhoodChart.types';
import { SUBGRAPH_URL, GRAPH_API_KEY } from '@/lib/api/subgraph';

interface UseChartDataProps {
  tokenAddress: string;
  timeframe: Timeframe;
  enabled?: boolean;
}

interface UseChartDataReturn {
  data: PriceDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Helper function to get time range in milliseconds for each timeframe
const getTimeRangeForTimeframe = (timeframe: Timeframe): number => {
  switch (timeframe) {
    case 'LIVE': return 3600000; // 1 hour
    case '4H': return 14400000; // 4 hours
    case '1D': return 86400000; // 1 day
    case '1W': return 604800000; // 1 week
    case '1M': return 2592000000; // 30 days
    case 'MAX': return Date.now(); // From beginning to now
    default: return 86400000; // 1 day
  }
};

// Helper function to calculate data points needed for each timeframe
const getDataPointsConfig = (timeframe: Timeframe) => {
  const now = Math.floor(Date.now() / 1000);
  
  switch (timeframe) {
    case 'LIVE': // Past hour, use hour data (minute data might not be available)
      return {
        since: now - 7200, // 2 hours ago to ensure we get data
        dataType: 'hour',
        maxPoints: 10 // Get more points
      };
    case '4H': // Past 4 hours, use hour data
      return {
        since: now - 14400, // 4 hours ago
        dataType: 'hour',
        maxPoints: 20 // Get more hours
      };
    case '1D': // Past day, use hour data
      return {
        since: now - 86400, // 1 day ago
        dataType: 'hour',
        maxPoints: 50 // Get more hours
      };
    case '1W': // Past week, use day data
      return {
        since: now - 604800, // 1 week ago
        dataType: 'day',
        maxPoints: 30 // Get more days
      };
    case '1M': // Past month, use day data
      return {
        since: now - 2592000, // 30 days ago
        dataType: 'day',
        maxPoints: 60 // Get more days
      };
    case 'MAX': // All time, use day data
      return {
        since: 0, // Will be adjusted to token creation time
        dataType: 'day',
        maxPoints: 365, // Get up to a year of daily data
        isMax: true // Flag to handle differently
      };
    default:
      return {
        since: now - 86400,
        dataType: 'hour',
        maxPoints: 30
      };
  }
};

// GraphQL queries for different data types
const GET_TOKEN_MINUTE_DATA = `
  query GetTokenMinuteData($token: ID!, $since: BigInt!, $first: Int!) {
    token(id: $token) {
      tokenMinuteData(
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

export function useChartData({ tokenAddress, timeframe, enabled = true }: UseChartDataProps): UseChartDataReturn {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    if (!enabled || !tokenAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config = getDataPointsConfig(timeframe);
      const token = tokenAddress.toLowerCase(); // Token ID must be lowercase for subgraph


      // First get token info to know the current price
      const tokenInfoResponse = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GRAPH_API_KEY}`
        },
        body: JSON.stringify({
          query: GET_TOKEN_INFO,
          variables: { token }
        })
      });

      const tokenInfoResult = await tokenInfoResponse.json();
      
      if (tokenInfoResult.errors) {
        console.error('GraphQL errors:', tokenInfoResult.errors);
      }
      
      const tokenInfo = tokenInfoResult.data?.token;

      if (!tokenInfo) {
        console.warn(`Token ${token} not found in subgraph`);
        setData([]);
        setLoading(false);
        return;
      }

      const currentPrice = parseFloat(tokenInfo.marketPrice || '0');
      const tokenCreatedAt = parseInt(tokenInfo.createdAtTimestamp || '0');
      
      // For MAX timeframe, use token creation time
      // For other timeframes, use the configured since time
      const actualSince = timeframe === 'MAX' 
        ? tokenCreatedAt 
        : Math.max(config.since, tokenCreatedAt);

      // Select appropriate query based on data type
      let query = GET_TOKEN_DAY_DATA;
      let dataKey = 'tokenDayData';
      
      if (config.dataType === 'minute') {
        query = GET_TOKEN_MINUTE_DATA;
        dataKey = 'tokenMinuteData';
      } else if (config.dataType === 'hour') {
        query = GET_TOKEN_HOUR_DATA;
        dataKey = 'tokenHourData';
      }

      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GRAPH_API_KEY}`
        },
        body: JSON.stringify({
          query,
          variables: { token, since: actualSince, first: config.maxPoints }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        console.error(`${dataKey} GraphQL errors:`, result.errors);
      }
      
      const rawData = result.data?.token?.[dataKey] || [];
      console.log(`Chart data for ${timeframe}:`, {
        dataKey,
        rawDataLength: rawData.length,
        since: new Date(actualSince * 1000).toISOString(),
        tokenCreatedAt: new Date(tokenCreatedAt * 1000).toISOString(),
        firstDataPoint: rawData[0],
        lastDataPoint: rawData[rawData.length - 1]
      });
      
      // Log sample data if available
      if (rawData.length > 0) {
        console.log(`Sample data for ${timeframe}:`, rawData.slice(0, 3));
      }
      // Process the data to exactly 60 points for optimal chart display
      const processedData = processChartData(rawData, currentPrice, timeframe);
      setData(processedData);
      
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, timeframe, enabled]);

  // Process raw subgraph data into exactly 60 chart points
  const processChartData = (rawData: any[], currentPrice: number, timeframe: Timeframe): PriceDataPoint[] => {
    if (rawData.length === 0) {
      console.log(`No data for ${timeframe}, creating flat line at current price:`, currentPrice);
      // If no historical data, create a flat line at current price
      const now = Date.now();
      const range = getTimeRangeForTimeframe(timeframe);
      const startTime = now - range;
      const points: PriceDataPoint[] = [];
      
      for (let i = 0; i < 60; i++) {
        points.push({
          timestamp: startTime + (i * (range / 59)), // Spread across the timeframe
          marketPrice: currentPrice,
          floorPrice: currentPrice * 0.95, // Floor is 95% of market price
          volume: 0
        });
      }
      return points;
    }

    // Sort data by timestamp
    const sortedData = [...rawData].sort((a, b) => 
      parseInt(a.timestamp) - parseInt(b.timestamp)
    );

    // Convert to PriceDataPoint format
    const dataPoints: PriceDataPoint[] = sortedData.map(item => ({
      timestamp: parseInt(item.timestamp) * 1000, // Convert to milliseconds
      marketPrice: parseFloat(item.marketPrice || '0'),
      floorPrice: parseFloat(item.floorPrice || '0'),
      volume: parseFloat(item.volume || '0')
    }));

    // Always return exactly 60 points
    return resampleTo60Points(dataPoints, timeframe);
  };

  // Resample data to exactly 60 points
  const resampleTo60Points = (data: PriceDataPoint[], timeframe: Timeframe): PriceDataPoint[] => {
    if (data.length === 0) return [];
    
    // If we have exactly 60 points, return as is
    if (data.length === 60) return data;
    
    // If we only have 1 point, create a flat line
    if (data.length === 1) {
      console.log(`Only 1 point for ${timeframe}, creating flat line`);
      const singlePoint = data[0];
      const result: PriceDataPoint[] = [];
      const range = getTimeRangeForTimeframe(timeframe);
      const now = Date.now();
      const startTime = now - range;
      
      for (let i = 0; i < 60; i++) {
        result.push({
          timestamp: startTime + (i * (range / 59)),
          marketPrice: singlePoint.marketPrice,
          floorPrice: singlePoint.floorPrice,
          volume: i === 59 ? singlePoint.volume : 0
        });
      }
      return result;
    }
    
    console.log(`Resampling ${data.length} points to 60 for ${timeframe}`);
    
    const result: PriceDataPoint[] = [];
    
    // If we have fewer than 60 points, we need to interpolate
    if (data.length < 60) {
      const firstPoint = data[0];
      const lastPoint = data[data.length - 1];
      const timeRange = lastPoint.timestamp - firstPoint.timestamp;
      const timeStep = timeRange / 59; // 60 points = 59 intervals
      
      let dataIndex = 0;
      for (let i = 0; i < 60; i++) {
        const targetTime = firstPoint.timestamp + (timeStep * i);
        
        // Find the appropriate data point for this time
        while (dataIndex < data.length - 1 && 
               data[dataIndex + 1].timestamp <= targetTime) {
          dataIndex++;
        }
        
        // Interpolate between points if we're between two data points
        if (dataIndex < data.length - 1) {
          const currentPoint = data[dataIndex];
          const nextPoint = data[dataIndex + 1];
          const timeFraction = (targetTime - currentPoint.timestamp) / (nextPoint.timestamp - currentPoint.timestamp);
          
          // Linear interpolation for smoother transitions
          result.push({
            timestamp: targetTime,
            marketPrice: currentPoint.marketPrice + (nextPoint.marketPrice - currentPoint.marketPrice) * Math.max(0, Math.min(1, timeFraction)),
            floorPrice: currentPoint.floorPrice + (nextPoint.floorPrice - currentPoint.floorPrice) * Math.max(0, Math.min(1, timeFraction)),
            volume: 0 // Only show volume on actual data points
          });
        } else {
          // Use the last known price for points beyond data
          const point = data[dataIndex];
          result.push({
            timestamp: targetTime,
            marketPrice: point.marketPrice,
            floorPrice: point.floorPrice,
            volume: i === 59 ? point.volume : 0
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

    if (timeframe === 'LIVE' && enabled) {
      const interval = setInterval(fetchChartData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchChartData, timeframe, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchChartData
  };
}