const fetch = require('node-fetch');

const SUBGRAPH_URL = 'https://gateway.thegraph.com/api/subgraphs/id/6wxyMZKxnNByx3WDzeBkWFF3D5YoVzE3DkvyCvuojHrZ';
const GRAPH_API_KEY = '7302378dbbe0ef268c60a5cee4251713';

// Test token address from the app
const TEST_TOKEN = '0x2a44f91b9b27dc8479b07c11c746ba9933025e73';

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
  
  tokenHourData: `
    query GetTokenHourData($token: ID!) {
      token(id: $token) {
        tokenHourData(
          orderBy: timestamp
          orderDirection: desc
          first: 10
        ) {
          timestamp
          marketPrice
          floorPrice
          volume
        }
      }
    }
  `,
  
  tokenDayData: `
    query GetTokenDayData($token: ID!) {
      token(id: $token) {
        tokenDayData(
          orderBy: timestamp
          orderDirection: desc
          first: 10
        ) {
          timestamp
          marketPrice
          floorPrice
          volume
        }
      }
    }
  `,
  
  tokenMinuteData: `
    query GetTokenMinuteData($token: ID!) {
      token(id: $token) {
        tokenMinuteData(
          orderBy: timestamp
          orderDirection: desc
          first: 10
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

async function testQuery(queryName, query) {
  try {
    console.log(`\n=== Testing ${queryName} ===`);
    
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GRAPH_API_KEY}`
      },
      body: JSON.stringify({
        query,
        variables: { token: TEST_TOKEN.toLowerCase() }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
    } else {
      const data = result.data?.token;
      if (data) {
        console.log(`Token found: ${data.id}`);
        
        if (queryName === 'tokenInfo') {
          console.log('Created at:', data.createdAtTimestamp ? new Date(data.createdAtTimestamp * 1000).toISOString() : 'Unknown');
          console.log('Market price:', data.marketPrice);
          console.log('Floor price:', data.floorPrice);
        } else {
          const dataKey = queryName === 'tokenHourData' ? 'tokenHourData' : 
                         queryName === 'tokenDayData' ? 'tokenDayData' : 'tokenMinuteData';
          const timeseriesData = data[dataKey] || [];
          console.log(`Found ${timeseriesData.length} ${dataKey} points`);
          
          if (timeseriesData.length > 0) {
            console.log('Most recent data point:');
            const recent = timeseriesData[0];
            console.log(`  Timestamp: ${new Date(recent.timestamp * 1000).toISOString()}`);
            console.log(`  Market Price: ${recent.marketPrice}`);
            console.log(`  Floor Price: ${recent.floorPrice}`);
            console.log(`  Volume: ${recent.volume}`);
          }
          
          if (timeseriesData.length > 1) {
            console.log('Sample of unique market prices:');
            const uniquePrices = new Set(timeseriesData.map(d => d.marketPrice));
            console.log(`  Unique prices count: ${uniquePrices.size} out of ${timeseriesData.length} data points`);
            console.log(`  Prices: ${[...uniquePrices].slice(0, 5).join(', ')}${uniquePrices.size > 5 ? '...' : ''}`);
          }
        }
      } else {
        console.log('No token data found');
      }
    }
  } catch (error) {
    console.error(`Error testing ${queryName}:`, error.message);
  }
}

async function runAllTests() {
  console.log('Testing chart data queries...');
  console.log('Token address:', TEST_TOKEN);
  
  for (const [queryName, query] of Object.entries(QUERIES)) {
    await testQuery(queryName, query);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

runAllTests();