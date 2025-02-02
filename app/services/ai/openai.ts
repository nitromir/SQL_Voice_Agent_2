import { AIProvider, Message, Visualization, ConnectionState, DebugInfo } from '../../types';
import { AudioProcessor } from '../audio/AudioProcessor';

export class OpenAIProvider implements AIProvider {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private seenEvents = new Set<string>();
  private audioProcessor: AudioProcessor | null = null;
  private sessionId: number | null = null;

  // Handlers
  private onStateChange?: (state: ConnectionState) => void;
  private onMessage?: (message: Message) => void;
  private onVisualization?: (visualization: Visualization | null) => void;
  private onDebug?: (info: DebugInfo) => void;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.autoplay = true;
    this.audioProcessor = new AudioProcessor();
    // Generate a random session ID for SQL queries
    this.sessionId = Math.floor(Math.random() * 1000000);
  }

  private logDebug(...args: any[]) {
    console.log(...args);
    if (this.onDebug) {
      this.onDebug({ lastAction: args.join(' ') });
    }
  }

  async connect(): Promise<void> {
    try {
      this.logDebug('🔄 Starting connection...');

      // Get session configuration
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tools: [{
            type: "function",
            name: 'query_database',
            description: 'Execute a natural language query against the database using the SQL agent',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The natural language query to execute against the database'
                }
              },
              required: ['query']
            }
          },
          {
            type: "function",
            name: 'visualize_data',
            description: 'Create a visualization of data points',
            parameters: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  description: 'Type of visualization',
                  enum: ['bar', 'line', 'pie', 'table']
                },
                data: {
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
                title: {
                  type: 'string',
                  description: 'Title for the visualization'
                }
              },
              required: ['type', 'data']
            }
          }],
          tool_choice: "auto"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get session configuration');
      }

      const data = await response.json();
      const EPHEMERAL_KEY = data.client_secret?.value;
      if (!EPHEMERAL_KEY) {
        throw new Error('Invalid session response: Missing token');
      }

      // Store session ID and configuration
      const sessionRef = data.session;
      const sessionId = sessionRef.id;
      this.logDebug('📝 Session configuration:', sessionRef);

      // Create WebRTC connection
      this.pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      });

      // Set up connection state handler
      this.pc.onconnectionstatechange = () => {
        const state = this.pc?.connectionState;
        this.logDebug('🔌 Connection state:', state);
        if (this.onStateChange && this.pc) {
          this.onStateChange(state as ConnectionState);
        }
      };

      // Add audio transceiver before creating data channel
      this.pc.addTransceiver('audio', {
        direction: 'sendrecv',
        streams: []
      });

      // Handle incoming audio tracks
      this.pc.ontrack = (event) => {
        if (event.track.kind === 'audio') {
          this.logDebug('🔊 Received audio track');
          const audioStream = new MediaStream([event.track]);
          if (this.audioElement) {
            this.audioElement.srcObject = audioStream;
            this.audioElement.play().catch(error => {
              this.logDebug('❌ Error playing audio:', error);
            });
          }
        }
      };

      // Create data channel with specific options
      this.dc = this.pc.createDataChannel('oai-events', { 
        ordered: true,
        maxRetransmits: 3
      });
      
      this.setupMessageHandler();

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve) => {
        const checkState = () => {
          if (this.pc?.iceGatheringState === 'complete') {
            resolve();
          }
        };
        checkState();
        this.pc!.onicegatheringstatechange = checkState;
      });

      // Check if connection is in a valid state to proceed
      const validStates: RTCPeerConnectionState[] = ['new', 'connecting', 'connected'];
      if (!this.pc || !validStates.includes(this.pc.connectionState)) {
        throw new Error('Connection in invalid state');
      }

      this.logDebug('🔄 Sending SDP offer...');

      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17&session=${sessionId}`, {
        method: "POST",
        body: this.pc.localDescription!.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`Failed to connect to OpenAI: ${errorText}`);
      }

      const answerSdp = await sdpResponse.text();

      // Check again if connection is still valid
      if (!this.pc || !validStates.includes(this.pc.connectionState)) {
        throw new Error('Connection state changed during setup');
      }

      await this.pc.setRemoteDescription(new RTCSessionDescription({
        type: "answer",
        sdp: answerSdp,
      }));

      this.logDebug('✅ Connection setup complete');

    } catch (error) {
      this.logDebug('❌ Connection failed:', error);
      if (this.onStateChange) {
        this.onStateChange('failed');
      }
      if (this.onDebug) {
        this.onDebug({ 
          lastError: error instanceof Error ? error.message : String(error),
          lastAction: 'Connection failed'
        });
      }
      throw error;
    }
  }

  private setupMessageHandler() {
    if (!this.dc) return;

    this.dc.onopen = () => {
      this.logDebug('📡 Data channel opened');
      if (this.onStateChange) {
        this.onStateChange('connected');
      }

      setTimeout(() => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(
            JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: 'Hi there!',
                  },
                ],
              },
            })
          );

          this.dc.send(
            JSON.stringify({
              type: 'response.create',
            })
          );
        }
      }, 1000);
    };

    this.dc.onmessage = async (event) => {
      try {
        const parsed = JSON.parse(event.data);
        this.logDebug('📨 Raw message:', JSON.stringify(parsed, null, 2));

        switch (parsed.type) {
          // --- Session
          case 'session.created':
          case 'session.updated':
            this.logDebug('✅ Session configured');
            break;

          // --- Speech
          case 'input_audio_buffer.speech_started':
            this.logDebug('🎤 Listening...');
            break;
          case 'input_audio_buffer.speech_stopped':
            this.logDebug('⌛ Processing...');
            break;
          case 'input_audio_buffer.committed':
          case 'input_audio_buffer.cleared':
            break;

          // --- Conversation item
          case 'conversation.item.created': {
            if (parsed.item?.type === 'message' && parsed.item.role === 'user') {
              const audioContent = parsed.item.content?.find(
                (c: any) => c.type === 'input_audio'
              );
              if (audioContent?.transcript) {
                this.logDebug('👤 You:', audioContent.transcript);
                if (this.onMessage) {
                  this.onMessage({
                    id: `user_${parsed.item.id}`,
                    type: 'user',
                    text: audioContent.transcript,
                    partial: false,
                  });
                }
              }
            }
            break;
          }

          // --- Response
          case 'response.created':
          case 'response.output_item.added':
            if (parsed.item?.type === 'function_call') {
              this.logDebug('🔧 Preparing function call:', parsed.item.name);
            }
            break;

          case 'response.output_item.done':
            // Handle completed function calls
            if (parsed.item?.type === 'function_call') {
              this.logDebug('🔧 Function call completed:', parsed.item.name);
            }
            break;

          case 'response.function_call_arguments.delta':
            // Partial function call arguments
            break;

          case 'response.function_call_arguments.done':
            if (parsed.name === 'query_database') {
              try {
                const args = JSON.parse(parsed.arguments);
                this.logDebug('📊 Executing query:', args.query);

                const sqlResponse = await fetch('/api/sql', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    query: args.query,
                    sessionId: this.sessionId
                  }),
                });

                const sqlResult = await sqlResponse.json();
                this.logDebug('📊 Query result:', sqlResult);

                // Send the function_call_output
                this.dc?.send(
                  JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: parsed.call_id,
                      output: JSON.stringify(sqlResult),
                    },
                  })
                );

                // Request next response
                this.dc?.send(
                  JSON.stringify({
                    type: 'response.create',
                  })
                );
              } catch (error) {
                console.error('Error executing SQL query:', error);

                // Send error output
                this.dc?.send(
                  JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: parsed.call_id,
                      output: JSON.stringify({
                        error: 'Failed to execute query',
                      }),
                    },
                  })
                );
              }
            } else if (parsed.name === 'visualize_data') {
              try {
                const args = JSON.parse(parsed.arguments);
                this.logDebug('📈 Creating visualization:', args);

                // Clear any existing visualization first
                if (this.onVisualization) {
                  this.onVisualization(null);
                }

                // Show the new visualization
                if (this.onVisualization) {
                  this.onVisualization({
                    type: args.type,
                    title: args.title || '',
                    data: args.data
                  });
                }

                // Send success output
                this.dc?.send(
                  JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: parsed.call_id,
                      output: JSON.stringify({ success: true }),
                    },
                  })
                );

                // Request next response
                this.dc?.send(
                  JSON.stringify({
                    type: 'response.create',
                  })
                );
              } catch (error) {
                console.error('Error creating visualization:', error);

                // Send error output
                this.dc?.send(
                  JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: parsed.call_id,
                      output: JSON.stringify({
                        error: 'Failed to create visualization',
                      }),
                    },
                  })
                );
              }
            }
            break;

          case 'response.audio_transcript.delta':
            if (parsed.delta && this.onMessage) {
              this.logDebug('🤖 (typing...)', parsed.delta);
              this.onMessage({
                id: `assistant_${parsed.item_id}`,
                type: 'assistant',
                text: parsed.delta,
                partial: true,
                delta: true
              });
            }
            break;

          case 'response.audio_transcript.done':
            if (parsed.transcript && this.onMessage) {
              this.logDebug('🤖 Assistant:', parsed.transcript);
              this.onMessage({
                id: `assistant_${parsed.item_id}`,
                type: 'assistant',
                text: parsed.transcript,
                partial: false,
              });
            }
            break;

          case 'response.done':
            // Response complete
            break;

          case 'error': {
            const errorMessage =
              typeof parsed.error.message === 'string'
                ? parsed.error.message
                : JSON.stringify(parsed.error);
            this.logDebug('❌ Error:', errorMessage);
            throw new Error(errorMessage);
          }

          default:
            // Don't warn about unknown message types
            break;
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logDebug('❌ Message error:', errMsg);
        if (this.onDebug) {
          this.onDebug({ lastError: errMsg });
        }
      }
    };
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32KB chunks
    
    // Process in chunks to handle large buffers
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  async processAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.dc || this.dc.readyState !== 'open') {
      this.logDebug('❌ Data channel not ready');
      return;
    }

    try {
      // Log the incoming data for debugging
      this.logDebug(`📢 Received audio data: ${audioData?.constructor?.name}, byteLength=${audioData?.byteLength}`);

      // Skip if audio level is too low
      if (!audioData?.byteLength) {
        return;  // Silently skip low-level audio
      }

      // Convert to base64
      const base64Audio = this.arrayBufferToBase64(audioData);
      
      if (!base64Audio) {
        this.logDebug('❌ Failed to convert audio to base64');
        return;
      }

      // Clear any existing buffer
      this.dc.send(JSON.stringify({
        type: 'input_audio_buffer.clear'
      }));

      // Send the audio chunk
      this.dc.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      }));

      // Commit the buffer to start processing
      this.dc.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
    } catch (error) {
      this.logDebug('❌ Error processing audio:', error);
    }
  }

  async addAudioTrack(track: MediaStreamTrack, stream: MediaStream): Promise<void> {
    if (!this.pc) {
      throw new Error('WebRTC not initialized');
    }

    // Initialize audio processor if needed
    if (!this.audioProcessor) {
      this.audioProcessor = new AudioProcessor();
    }
    await this.audioProcessor.initialize();

    // Connect stream to audio processor
    this.audioProcessor.connectStream(stream);

    // Set up audio data handler
    this.audioProcessor.setAudioDataHandler((audioData) => {
      if (this.dc?.readyState === 'open') {
        this.processAudio(audioData.buffer);
      }
    });

    // Find the audio transceiver
    const transceivers = this.pc.getTransceivers();
    const audioTransceiver = transceivers.find(
      t => t.receiver.track.kind === 'audio'
    );

    if (!audioTransceiver) {
      throw new Error('No audio transceiver found');
    }

    // Replace the track in the existing transceiver
    await audioTransceiver.sender.replaceTrack(track);
  }

  isConnected(): boolean {
    return this.dc?.readyState === 'open' && this.pc?.connectionState === 'connected';
  }

  disconnect() {
    if (this.audioProcessor) {
      this.audioProcessor.cleanup();
      this.audioProcessor = null;
    }

    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    if (this.pc) {
      // Close all transceivers
      const transceivers = this.pc.getTransceivers();
      transceivers.forEach(transceiver => {
        if (transceiver.stop) {
          transceiver.stop();
        }
      });

      this.pc.close();
      this.pc = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }

    this.seenEvents.clear();
  }

  setStateChangeHandler(handler: (state: ConnectionState) => void) {
    this.onStateChange = handler;
  }

  setMessageHandler(handler: (message: Message) => void) {
    this.onMessage = handler;
  }

  setVisualizationHandler(handler: (visualization: Visualization | null) => void) {
    this.onVisualization = handler;
  }

  setDebugHandler(handler: (info: DebugInfo) => void) {
    this.onDebug = handler;
  }
}
