const { request, gql } = require('graphql-request');

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/36520/stickernet-basesepolia/version/latest';

// First, let's just try to get all tokenPositions
const SIMPLE_QUERY = gql`
  query SimpleTest {
    tokenPositions(first: 5) {
      id
      contentOwned
    }
  }
`;

async function testQuery() {
  try {
    console.log('Testing simple query...');
    const data = await request(SUBGRAPH_URL, SIMPLE_QUERY);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testQuery();