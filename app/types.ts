export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  partial?: boolean;
  delta?: boolean;
  sqlResult?: any;
  visualization?: {
    type: string;
    title: string;
    formattedText: string;
  };
}

export interface DebugInfo {
  lastError?: string;
  lastAction?: string;
}

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export interface SQLQueryFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: {
      query: {
        type: 'string';
        description: string;
      };
    };
    required: string[];
  };
}

export interface DataPoint {
  label: string;
  value: number;
}

export interface Visualization {
  type: string;
  title: string;
  data: Array<{
    label: string;
    value: number;
  }>;
}

export interface VisualizationRequest {
  type: 'bar' | 'line' | 'pie' | 'table';
  data: DataPoint[];
  title?: string;
}

export interface AIProvider {
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  processAudio(audioData: Int16Array): Promise<void>;
  addAudioTrack(track: MediaStreamTrack, stream: MediaStream): Promise<void>;
  setStateChangeHandler(handler: (state: ConnectionState) => void): void;
  setMessageHandler(handler: (message: Message) => void): void;
  setVisualizationHandler(handler: (visualization: Visualization | null) => void): void;
  setDebugHandler(handler: (info: DebugInfo) => void): void;
}

export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  language?: string;
}
