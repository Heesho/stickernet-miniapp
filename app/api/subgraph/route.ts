import { NextResponse } from 'next/server';
import { SUBGRAPH_URL, GRAPH_API_KEY } from '@/lib/api/subgraph';

export async function POST(req: Request) {
  try {
    const { query, variables } = await req.json();

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GRAPH_API_KEY ? { 'Authorization': `Bearer ${GRAPH_API_KEY}` } : {}),
      },
      body: JSON.stringify({ query, variables })
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ errors: [{ message: (error as Error).message }] }, { status: 500 });
  }
}
