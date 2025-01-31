import { NextResponse } from 'next/server';

const N8N_ENDPOINT = process.env.N8N_SQL_AGENT_ENDPOINT;

export async function POST(request: Request) {
  try {
    const { query, sessionId } = await request.json();

    if (!N8N_ENDPOINT) {
      throw new Error('N8N SQL Agent endpoint not configured');
    }

    // Ensure sessionId is a number
    const numericSessionId = Number(sessionId);
    if (isNaN(numericSessionId)) {
      throw new Error('Invalid session ID');
    }

    const payload = {
      message: query,
      sessionID: numericSessionId
    };

    console.log('📊 Sending request to SQL Agent:', payload);

    const response = await fetch(N8N_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Get the error response if possible
      let errorDetail = '';
      try {
        const errorResponse = await response.json();
        errorDetail = JSON.stringify(errorResponse);
      } catch {
        errorDetail = response.statusText;
      }

      console.error('N8N SQL Agent Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetail
      });

      return NextResponse.json(
        { error: `SQL Agent error: ${errorDetail}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📊 SQL Agent response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('SQL Query Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute SQL query' },
      { status: 500 }
    );
  }
}
