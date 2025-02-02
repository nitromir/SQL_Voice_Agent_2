import { AIProvider, Message, Visualization, ConnectionState, DebugInfo } from '../../types';
import { AudioProcessor } from '../audio/AudioProcessor';
import { UltravoxSession, UltravoxSessionStatus } from 'ultravox-client';

type Role = 'user' | 'agent';
type Medium = 'voice' | 'text';

interface Transcript {
  text: string;
  isFinal: boolean;
  speaker: Role;
  medium: Medium;
}

export class UltravoxProvider implements AIProvider {
  private audioElement: HTMLAudioElement | null = null;
  private audioProcessor: AudioProcessor | null = null;
  private sessionId: number | null = null;
  private ultravoxSession: UltravoxSession | null = null;
  private connectionState: ConnectionState = 'new';
  private stateChangeHandler?: (state: ConnectionState) => void;
  private messageHandler?: (message: Message) => void;
  private visualizationHandler?: (visualization: Visualization | null) => void;
  private debugHandler?: (info: DebugInfo) => void;
  private mediaStream: MediaStream | null = null;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.autoplay = true;
    this.audioProcessor = new AudioProcessor();
    this.sessionId = Math.floor(Math.random() * 1000000);
  }

  private logDebug(action: string, ...args: any[]) {
    console.log(action, ...args);
    if (this.debugHandler) {
      this.debugHandler({ lastAction: action });
    }
  }

  private mapUltravoxStatusToConnectionState(status: UltravoxSessionStatus): ConnectionState {
    switch (status) {
      case UltravoxSessionStatus.DISCONNECTED:
        return 'disconnected';
      case UltravoxSessionStatus.DISCONNECTING:
        return 'disconnected';
      case UltravoxSessionStatus.CONNECTING:
        return 'connecting';
      case UltravoxSessionStatus.IDLE:
      case UltravoxSessionStatus.LISTENING:
      case UltravoxSessionStatus.THINKING:
      case UltravoxSessionStatus.SPEAKING:
        return 'connected';
      default:
        return 'new';
    }
  }

  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  async connect(): Promise<void> {
    try {
      this.logDebug('Starting Ultravox connection...');
      
      // Get API key and create call
      const response = await fetch('/api/ultravox-call', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create Ultravox call: ${response.statusText}`);
      }
      
      const { joinUrl } = await response.json();
      
      if (!joinUrl) {
        throw new Error('No join URL received from server');
      }

      // Initialize Ultravox session
      this.ultravoxSession = new UltravoxSession();

      // Register tool implementations
      this.ultravoxSession.registerToolImplementations({
        'query_database': async (parameters: any) => {
          try {
            this.logDebug(' Executing query:', parameters.query);

            const sqlResponse = await fetch('/api/sql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: parameters.query,
                sessionId: this.sessionId
              }),
            });

            if (!sqlResponse.ok) {
              throw new Error('SQL query failed');
            }

            const sqlResult = await sqlResponse.json();
            this.logDebug(' Query result:', sqlResult);

            // Return just the response string
            return sqlResult.response;
          } catch (error) {
            console.error('Error executing SQL query:', error);
            return 'Failed to execute query: ' + (error instanceof Error ? error.message : String(error));
          }
        },
        'visualize_data': async (parameters: any) => {
          try {
            this.logDebug(' Creating visualization:', parameters);

            // Clear any existing visualization first
            if (this.visualizationHandler) {
              this.visualizationHandler(null);
            }

            // Show the new visualization
            if (this.visualizationHandler) {
              this.visualizationHandler({
                type: parameters.type,
                title: parameters.title || '',
                data: parameters.data
              });
            }

            return JSON.stringify({ success: true });
          } catch (error) {
            console.error('Error creating visualization:', error);
            throw new Error('Failed to create visualization');
          }
        }
      });
      
      // Join the call
      await this.ultravoxSession.joinCall(joinUrl);

      // Set up Ultravox event handlers
      this.ultravoxSession.addEventListener('status', (event) => {
        if (!this.ultravoxSession) return;
        const status = this.ultravoxSession.status;
        const newState = this.mapUltravoxStatusToConnectionState(status);
        this.connectionState = newState;
        if (this.stateChangeHandler) {
          this.stateChangeHandler(newState);
        }
      });

      this.ultravoxSession.addEventListener('transcripts', (event) => {
        if (this.messageHandler && this.ultravoxSession) {
          const transcripts = this.ultravoxSession.transcripts;
          const latestTranscript = transcripts[transcripts.length - 1];
          
          if (latestTranscript && latestTranscript.speaker === 'agent') {
            this.messageHandler({
              id: String(Date.now()),
              type: 'assistant',
              text: latestTranscript.text,
              partial: !latestTranscript.isFinal
            });
          }
        }
      });

      // Wait for initial connection
      const connectionTimeout = 10000;
      const startTime = Date.now();
      
      while (Date.now() - startTime < connectionTimeout) {
        if (this.ultravoxSession && 
            this.ultravoxSession.status !== UltravoxSessionStatus.DISCONNECTED && 
            this.ultravoxSession.status !== UltravoxSessionStatus.CONNECTING) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!this.ultravoxSession || this.ultravoxSession.status === UltravoxSessionStatus.DISCONNECTED) {
        throw new Error('Connection timeout - failed to establish connection');
      }

      // Set up audio output
      this.ultravoxSession.addEventListener('track', (event: any) => {
        if (event.track.kind === 'audio' && this.audioElement) {
          const stream = new MediaStream([event.track]);
          this.audioElement.srcObject = stream;
        }
      });

    } catch (error) {
      this.logDebug('Connection error:', error);
      this.connectionState = 'failed';
      if (this.stateChangeHandler) {
        this.stateChangeHandler('failed');
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      if (this.ultravoxSession) {
        await this.ultravoxSession.leaveCall();
        this.ultravoxSession = null;
      }

      if (this.audioElement) {
        this.audioElement.srcObject = null;
      }

      this.connectionState = 'disconnected';
      if (this.stateChangeHandler) {
        this.stateChangeHandler('disconnected');
      }
    } catch (error) {
      this.logDebug('Disconnection error:', error);
      throw error;
    }
  }

  async processAudio(audioData: ArrayBuffer): Promise<void> {
    // Not needed for Ultravox as it handles audio internally
  }

  async addAudioTrack(track: MediaStreamTrack, stream: MediaStream): Promise<void> {
    if (!this.ultravoxSession) {
      throw new Error('No active Ultravox session');
    }

    try {
      // Store the media stream for cleanup
      this.mediaStream = stream;

      // Add the audio track to the WebRTC connection
      const pc = (this.ultravoxSession as any).peerConnection;
      if (pc) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      }
      
      this.logDebug('Added audio track to Ultravox session');
    } catch (error) {
      this.logDebug('Error adding audio track:', error);
      throw error;
    }
  }

  setStateChangeHandler(handler: (state: ConnectionState) => void): void {
    this.stateChangeHandler = handler;
  }

  setMessageHandler(handler: (message: Message) => void): void {
    this.messageHandler = handler;
  }

  setVisualizationHandler(handler: (visualization: Visualization | null) => void): void {
    this.visualizationHandler = handler;
  }

  setDebugHandler(handler: (info: DebugInfo) => void): void {
    this.debugHandler = handler;
  }
}
