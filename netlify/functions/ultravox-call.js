const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
    
    if (!ULTRAVOX_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'ULTRAVOX_API_KEY is not configured',
          details: 'Visit https://docs.fixie.ai to get your API key.'
        })
      }
    }

    const response = await fetch('https://api.ultravox.ai/api/calls', {
      method: 'POST',
      headers: {
        'X-API-Key': ULTRAVOX_API_KEY.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'fixie-ai/ultravox-70B',
        systemPrompt: process.env.SYSTEM_PROMPT,
        voice: "Tanya-English",
        temperature: 0.1,
        initialOutputMedium: 'MESSAGE_MEDIUM_VOICE',
        medium: {
          webRtc: {}
        },
        joinTimeout: '30s',
        maxDuration: '3600s',
        firstSpeaker: 'FIRST_SPEAKER_AGENT',
        selectedTools: [{
          temporaryTool: {
            modelToolName: 'query_database',
            description: 'Execute a natural language query against the database using the SQL agent',
            timeout: '15s',
            dynamicParameters: [{
              name: 'query',
              location: 'PARAMETER_LOCATION_BODY',
              schema: {
                type: 'string',
                description: 'The natural language query to execute against the database'
              },
              required: true
            }],
            client: {}
          }
        },
        {
          temporaryTool: {
            modelToolName: 'visualize_data',
            description: 'Create a visualization of data points',
            dynamicParameters: [{
              name: 'type',
              location: 'PARAMETER_LOCATION_BODY',
              schema: {
                type: 'string',
                description: 'Type of visualization',
                enum: ['bar', 'line', 'pie', 'table']
              },
              required: true
            },
            {
              name: 'data',
              location: 'PARAMETER_LOCATION_BODY',
              schema: {
                type: 'array',
                description: 'Array of data points to visualize',
                items: {
                  type: 'object',
                  properties: {
                    label: {
                      type: 'string',
                      description: 'Label for the data point'
                    },
                    value: {
                      type: 'number',
                      description: 'Numeric value for the data point'
                    }
                  },
                  required: ['label', 'value']
                }
              },
              required: true
            },
            {
              name: 'title',
              location: 'PARAMETER_LOCATION_BODY',
              schema: {
                type: 'string',
                description: 'Title for the visualization'
              },
              required: false
            }],
            client: {}
          }
        }],
        recordingEnabled: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('Ultravox API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Ultravox API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.joinUrl) {
      throw new Error('No join URL received from Ultravox API');
    }

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
    console.error('Error creating Ultravox call:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Failed to create Ultravox call',
        details: error instanceof Error ? error.message : String(error)
      })
    };
  }
};