const fetch = require('node-fetch');

const SUBGRAPH_URL = 'https://gateway.thegraph.com/api/subgraphs/id/6wxyMZKxnNByx3WDzeBkWFF3D5YoVzE3DkvyCvuojHrZ';
const GRAPH_API_KEY = '7302378dbbe0ef268c60a5cee4251713';
const TEST_TOKEN = '0x2a44f91b9b27dc8479b07c11c746ba9933025e73';

const getDataPointsConfig = (timeframe) => {
  const now = Math.floor(Date.now() / 1000);
  
  switch (timeframe) {
    case 'LIVE':
      return {
        since: now - 7200,
        dataType: 'hour',
        maxPoints: 10
      };
    case '4H':
      return {
        since: now - 14400,
        dataType: 'hour',
        maxPoints: 20
      };
    case '1D':
      return {
        since: now - 86400,
        dataType: 'hour',
        maxPoints: 50
      };
    case '1W':
      return {
        since: now - 604800,
        dataType: 'day',
        maxPoints: 30
      };
    case '1M':
      return {
        since: now - 2592000,
        dataType: 'day',
        maxPoints: 60
      };
    case 'MAX':
      return {
        since: 0,
        dataType: 'day',
        maxPoints: 365,
        isMax: true
      };
    default:
      return {
        since: now - 86400,
        dataType: 'hour',
        maxPoints: 30
      };
  }
};

const QUERIES = {
  tokenInfo: `
    query GetTokenInfo($token: ID!) {
      token(id: $token) {
        id
        createdAtTimestamp
        marketPrice
        floorPrice
      }
    }
  `,
  
  hour: `
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
  `,
  
  day: `
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
  `
};

async function testTimeframe(timeframe) {
  try {
    console.log(`\n=== Testing ${timeframe} ===`);
    
    // Get token info first
    const tokenInfoResponse = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GRAPH_API_KEY}`
      },
      body: JSON.stringify({
        query: QUERIES.tokenInfo,
        variables: { token: TEST_TOKEN.toLowerCase() }
      })
    });

    const tokenInfoResult = await tokenInfoResponse.json();
    const tokenInfo = tokenInfoResult.data?.token;
    const tokenCreatedAt = parseInt(tokenInfo?.createdAtTimestamp || '0');
    
    const config = getDataPointsConfig(timeframe);
    const actualSince = timeframe === 'MAX' 
      ? tokenCreatedAt 
      : Math.max(config.since, tokenCreatedAt);
    
    console.log(`Config: ${config.dataType} data, since ${new Date(actualSince * 1000).toISOString()}`);
    
    // Query appropriate data
    const query = config.dataType === 'hour' ? QUERIES.hour : QUERIES.day;
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GRAPH_API_KEY}`
      },
      body: JSON.stringify({
        query,
        variables: { 
          token: TEST_TOKEN.toLowerCase(),
          since: actualSince,
          first: config.maxPoints
        }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return;
    }
    
    const dataKey = config.dataType === 'hour' ? 'tokenHourData' : 'tokenDayData';
    const rawData = result.data?.token?.[dataKey] || [];
    
    console.log(`Found ${rawData.length} data points`);
    
    if (rawData.length > 0) {
      console.log('First point:', {
        timestamp: new Date(rawData[0].timestamp * 1000).toISOString(),
        marketPrice: rawData[0].marketPrice,
        volume: rawData[0].volume
      });
      
      console.log('Last point:', {
        timestamp: new Date(rawData[rawData.length - 1].timestamp * 1000).toISOString(),
        marketPrice: rawData[rawData.length - 1].marketPrice,
        volume: rawData[rawData.length - 1].volume
      });
      
      // Check if prices vary
      const uniquePrices = new Set(rawData.map(d => d.marketPrice));
      console.log(`Unique prices: ${uniquePrices.size} out of ${rawData.length} points`);
      
      // Check if all volumes are 0
      const nonZeroVolumes = rawData.filter(d => parseFloat(d.volume) > 0);
      console.log(`Points with volume > 0: ${nonZeroVolumes.length}`);
      
      if (uniquePrices.size === 1) {
        console.log('⚠️  ALL PRICES ARE THE SAME - This will create a flat line!');
      }
      
      if (nonZeroVolumes.length === 0) {
        console.log('⚠️  ALL VOLUMES ARE ZERO - This will create a flat line!');
      }
    } else {
      console.log('⚠️  NO DATA FOUND - This will create a flat line!');
    }
    
  } catch (error) {
    console.error(`Error testing ${timeframe}:`, error.message);
  }
}

async function runAllTests() {
  const testTimeframes = ['LIVE', '4H', '1D', '1W', '1M', 'MAX'];
  
  for (const timeframe of testTimeframes) {
    await testTimeframe(timeframe);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

runAllTests();