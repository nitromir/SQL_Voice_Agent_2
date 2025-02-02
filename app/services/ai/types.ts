export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  partial?: boolean;
  delta?: boolean;
}

export interface DebugInfo {
  lastError?: string;
  lastAction?: string;
}

export interface Visualization {
  type: string;
  title: string;
  data: Array<{
    label: string;
    value: number;
  }>;
}

export interface AIProvider {
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  setStateChangeHandler(handler: (state: ConnectionState) => void): void;
  setMessageHandler(handler: (message: Message) => void): void;
  setVisualizationHandler(handler: (visualization: Visualization | null) => void): void;
  setDebugHandler(handler: (info: DebugInfo) => void): void;
  processAudio(audioData: Int16Array): Promise<void>;
}

export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  language?: string;
}
