// Mock implementation of ultravox-client
export enum UltravoxSessionStatus {
  DISCONNECTED = 'disconnected',
  DISCONNECTING = 'disconnecting',
  CONNECTING = 'connecting',
  IDLE = 'idle',
  LISTENING = 'listening',
  THINKING = 'thinking',
  SPEAKING = 'speaking'
}

export class UltravoxSession {
  public status: UltravoxSessionStatus = UltravoxSessionStatus.DISCONNECTED;
  private audioTrack: MediaStreamTrack | null = null;
  private toolImplementations: Record<string, Function> = {};
  public transcripts: Array<{
    text: string;
    isFinal: boolean;
    speaker: 'user' | 'agent';
    medium: 'voice' | 'text';
  }> = [];
  private eventHandlers: Record<string, Array<(event: any) => void>> = {};
  public peerConnection?: RTCPeerConnection;
  private isDisconnecting: boolean = false;

  constructor() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });
  }

  addEventListener(event: string, handler: (event: any) => void): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  removeEventListener(event: string, handler: (event: any) => void): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }

  async joinCall(joinUrl: string): Promise<void> {
    this.status = UltravoxSessionStatus.CONNECTING;
    this.emit('status', { status: this.status });
    
    this.status = UltravoxSessionStatus.IDLE;
    this.emit('status', { status: this.status });
    
    // Add a mock transcript after connection
    setTimeout(() => {
      this.transcripts.push({
        text: "Hello! I'm ready to help you.",
        isFinal: true,
        speaker: 'agent',
        medium: 'voice'
      });
      this.emit('transcripts', { transcripts: this.transcripts });
    }, 1500);
  }

  async leaveCall(): Promise<void> {
    if (this.isDisconnecting) return;
    this.isDisconnecting = true;

    // Stop audio track if exists
    if (this.audioTrack) {
      this.audioTrack.stop();
      this.audioTrack = null;
    }

    // Close peer connection
    this.status = UltravoxSessionStatus.DISCONNECTING;
    this.emit('status', { status: this.status });

    if (this.peerConnection) {
      this.peerConnection.getTransceivers().forEach(transceiver => {
        if (transceiver.stop) {
          transceiver.stop();
        }
      });
      this.peerConnection.close();
      this.peerConnection = undefined;
    }

    this.status = UltravoxSessionStatus.DISCONNECTED;
    // Clear event handlers before final status update
    this.eventHandlers = {};
    
    // Set final status without triggering events
    this.status = UltravoxSessionStatus.DISCONNECTED;
    this.isDisconnecting = false;
  }

  registerToolImplementations(tools: Record<string, Function>): void {
    // Store implementation for later use
    Object.entries(tools).forEach(([name, implementation]) => {
      this.toolImplementations[name] = implementation;
    });
  }

  // Add mock method for adding tracks
  addTrack(track: MediaStreamTrack, stream: MediaStream): void {
    this.audioTrack = track;
    if (this.peerConnection) {
      this.peerConnection.addTrack(track, stream);
    }
  }

  private emit(event: string, data: any): void {
    if (this.status === UltravoxSessionStatus.DISCONNECTED) return;
    
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }
}