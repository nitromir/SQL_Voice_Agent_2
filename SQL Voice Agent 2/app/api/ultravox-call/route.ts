import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '../../constants';

export async function GET() {
  try {
    const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
    
    if (!ULTRAVOX_API_KEY) {
      console.error('ULTRAVOX_API_KEY is not configured in environment variables');
      return NextResponse.json(
        { 
          error: 'Ultravox API key is not configured. Please add ULTRAVOX_API_KEY to your .env.local file.',
          details: 'Visit https://docs.fixie.ai to get your API key.'
        },
        { status: 500 }
      );
    }

    const systemPrompt = SYSTEM_PROMPT;

    // Create a new Ultravox call
    const response = await fetch('https://api.ultravox.ai/api/calls', {
      method: 'POST',
      headers: {
        'X-API-Key': ULTRAVOX_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'fixie-ai/ultravox-70B',
        systemPrompt,
        voice: "Mark",
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
            client: {} // Specify this is a client-side tool
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
            client: {} // Specify this is a client-side tool
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

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Error creating Ultravox call:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create Ultravox call',
        details: error.message
      },
      { status: 500 }
    );
  }
}
