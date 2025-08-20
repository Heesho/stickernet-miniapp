// Test the timeframe logic from useChartData.ts

const getDataPointsConfig = (timeframe) => {
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

const testTimeframes = ['LIVE', '4H', '1D', '1W', '1M', 'MAX'];

console.log('Timeframe configurations:');
console.log('Current timestamp:', Math.floor(Date.now() / 1000));

testTimeframes.forEach(timeframe => {
  const config = getDataPointsConfig(timeframe);
  console.log(`\n${timeframe}:`);
  console.log(`  Data type: ${config.dataType}`);
  console.log(`  Since: ${config.since} (${new Date(config.since * 1000).toISOString()})`);
  console.log(`  Max points: ${config.maxPoints}`);
});

// Test the specific problem: token was created 2025-08-19T02:04:34.000Z
const tokenCreatedAt = Math.floor(new Date('2025-08-19T02:04:34.000Z').getTime() / 1000);
console.log('\nToken created at:', tokenCreatedAt, new Date(tokenCreatedAt * 1000).toISOString());

testTimeframes.forEach(timeframe => {
  const config = getDataPointsConfig(timeframe);
  const actualSince = timeframe === 'MAX' 
    ? tokenCreatedAt 
    : Math.max(config.since, tokenCreatedAt);
  
  const timeDiff = Math.floor(Date.now() / 1000) - actualSince;
  const hoursDiff = timeDiff / 3600;
  
  console.log(`\n${timeframe} actual query range:`);
  console.log(`  From: ${new Date(actualSince * 1000).toISOString()}`);
  console.log(`  Hours of data: ${hoursDiff.toFixed(1)}`);
  console.log(`  Expected data type: ${config.dataType}`);
});