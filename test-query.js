const { request, gql } = require('graphql-request');

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/36520/stickernet-basesepolia/version/latest';

const TEST_QUERY = gql`
  query TestTokenPosition {
    tokenPositions(where: { id: "0x2a44f91b9b27dc8479b07c11c746ba9933025e73-0xcf20981618491c7a3004979c0ec6d3493a749d47" }) {
      id
      contentOwned
      contentBalance
      curationSpend
    }
    tokens(where: { id: "0x2a44f91b9b27dc8479b07c11c746ba9933025e73" }) {
      id
      contentBalance
      marketPrice
    }
  }
`;

async function testQuery() {
  try {
    console.log('Testing query...');
    const data = await request(SUBGRAPH_URL, TEST_QUERY);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuery();