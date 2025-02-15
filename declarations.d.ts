declare module 'ultravox-client' {
  export class UltravoxSession {
    constructor();
    peerConnection?: RTCPeerConnection;
    status: UltravoxSessionStatus;
    transcripts: Array<{
      text: string;
      isFinal: boolean;
      speaker: 'user' | 'agent';
      medium: 'voice' | 'text';
    }>;
    addEventListener(event: 'status' | 'transcripts' | 'track', handler: (event: any) => void): void;
    removeEventListener(event: 'status' | 'transcripts' | 'track', handler: (event: any) => void): void;
    public joinCall(joinUrl: string): Promise<void>;
    public leaveCall(): Promise<void>;
    public registerToolImplementations(tools: Record<string, Function>): void;
  }

  export enum UltravoxSessionStatus {
    DISCONNECTED = 'disconnected',
    DISCONNECTING = 'disconnecting',
    CONNECTING = 'connecting',
    IDLE = 'idle',
    LISTENING = 'listening',
    THINKING = 'thinking',
    SPEAKING = 'speaking'
  }
}