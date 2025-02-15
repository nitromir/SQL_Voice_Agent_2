const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const N8N_ENDPOINT = process.env.N8N_SQL_AGENT_ENDPOINT;
    const { query, sessionId } = JSON.parse(event.body);

    if (!N8N_ENDPOINT) {
      throw new Error('N8N SQL Agent endpoint not configured. Please add N8N_SQL_AGENT_ENDPOINT to your .env file.');
    }

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

      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({ error: `SQL Agent error: ${errorDetail}` })
      };
    }

    const data = await response.json();
    console.log('📊 SQL Agent response:', data);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('SQL Query Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to execute SQL query' 
      })
    };
  }
};