const express = require('express');
const next = require('next');
const cors = require('cors');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Load environment variables
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3001;

app.prepare().then(() => {
  const server = express();

  // Middleware
  server.use(cors());
  server.use(express.json());

  // API Routes
  server.post('/api/session', async (req, res) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.' 
      });
    }
    
    try {
      const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        return res.status(response.status).json({ 
          error: `Failed to generate token: ${errorText}`,
          status: response.status,
          statusText: response.statusText
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Session Error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to create session' 
      });
    }
  });

  server.post('/api/sql', async (req, res) => {
    const N8N_ENDPOINT = process.env.N8N_SQL_AGENT_ENDPOINT;

    try {
      const { query, sessionId } = req.body;

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

        return res.status(response.status).json({ 
          error: `SQL Agent error: ${errorDetail}` 
        });
      }

      const data = await response.json();
      console.log('📊 SQL Agent response:', data);
      res.json(data);
    } catch (error) {
      console.error('SQL Query Error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to execute SQL query' 
      });
    }
  });

  server.get('/api/ultravox-call', async (req, res) => {
    try {
      const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
      
      if (!ULTRAVOX_API_KEY) {
        const error = 'ULTRAVOX_API_KEY is not configured. Please add ULTRAVOX_API_KEY to your .env file.';
        console.error(error);
        return res.status(500).json({ 
          error,
          details: 'Visit https://docs.fixie.ai to get your API key.'
        });
      }

      const systemPrompt = process.env.SYSTEM_PROMPT;

      const response = await fetch('https://api.ultravox.ai/api/calls', {
        method: 'POST',
        headers: {
          'X-API-Key': ULTRAVOX_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'fixie-ai/ultravox-70B',
          systemPrompt,
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

      res.json(data);
    } catch (error) {
      console.error('Error creating Ultravox call:', error);
      res.status(500).json({ 
        error: 'Failed to create Ultravox call',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  server.post('/api/visualize', async (req, res) => {
    try {
      const { type, data, title } = req.body;

      if (!Array.isArray(data)) {
        throw new Error('Data must be an array of data points');
      }

      const result = {
        visualization: {
          type: type || chooseChartType(data),
          title: title || 'Data Visualization',
          data: data
        }
      };

      res.json(result);
    } catch (error) {
      console.error('Visualization Error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to create visualization' 
      });
    }
  });

  // Serve static files from the out directory
  server.use(express.static('out'));

  // Handle all other routes with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

// Helper function to choose chart type
function chooseChartType(data) {
  if (data.length <= 5) {
    return 'pie';
  }
  
  const datePattern = /^\d{4}(-\d{2})?(-\d{2})?$|^Q[1-4]|^[A-Z][a-z]{2}/;
  const hasTimeLabels = data.some(item => datePattern.test(item.label));
  
  if (hasTimeLabels) {
    return 'line';
  }
  
  return 'bar';
}