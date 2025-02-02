export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioTransceiver: RTCRtpTransceiver | null = null;

  constructor(
    private onStateChange?: (state: RTCPeerConnectionState) => void,
    private onDebug?: (info: any) => void
  ) {}

  private logDebug(...args: any[]) {
    console.log(...args);
    this.onDebug?.({ lastAction: args.join(' ') });
  }

  async initialize(iceServers: RTCIceServer[]): Promise<void> {
    try {
      // Create new RTCPeerConnection
      this.pc = new RTCPeerConnection({
        iceServers,
      });

      // Add connection state change handler
      this.pc.onconnectionstatechange = () => {
        this.logDebug('🔌 Connection state:', this.pc?.connectionState);
        this.onStateChange?.(this.pc?.connectionState || 'closed');
      };

      // Create data channel
      this.dc = this.pc.createDataChannel('oai-events', { ordered: true });

      // Add audio transceiver
      this.audioTransceiver = this.pc.addTransceiver('audio', {
        direction: 'sendrecv',
        streams: []
      });

      // Set up audio output
      this.pc.ontrack = (e) => {
        if (e.track.kind === 'audio') {
          const audioElem = new Audio();
          audioElem.srcObject = new MediaStream([e.track]);
          audioElem.play().catch(console.error);
        }
      };

      this.logDebug('🎤 WebRTC initialized');
    } catch (error) {
      this.logDebug('❌ WebRTC initialization failed:', error);
      throw error;
    }
  }

  async addAudioTrack(track: MediaStreamTrack, stream: MediaStream): Promise<void> {
    if (!this.pc || !this.audioTransceiver) {
      throw new Error('WebRTC not initialized');
    }

    try {
      // Replace the track in the existing transceiver
      await this.audioTransceiver.sender.replaceTrack(track);
      this.logDebug('🎤 Audio track added');
    } catch (error) {
      this.logDebug('❌ Failed to add audio track:', error);
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) {
      throw new Error('WebRTC not initialized');
    }

    try {
      // Create offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (this.pc?.iceGatheringState === 'complete') {
          resolve();
        } else {
          this.pc!.onicegatheringstatechange = () => {
            if (this.pc?.iceGatheringState === 'complete') {
              resolve();
            }
          };
        }
      });

      this.logDebug('📝 Offer created');
      return this.pc.localDescription!;
    } catch (error) {
      this.logDebug('❌ Failed to create offer:', error);
      throw error;
    }
  }

  async setRemoteDescription(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) {
      throw new Error('WebRTC not initialized');
    }

    try {
      await this.pc.setRemoteDescription(answer);
      this.logDebug('📝 Remote description set');
    } catch (error) {
      this.logDebug('❌ Failed to set remote description:', error);
      throw error;
    }
  }

  getDataChannel(): RTCDataChannel | null {
    return this.dc;
  }

  close(): void {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.audioTransceiver = null;
    this.logDebug('👋 WebRTC connection closed');
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.pc?.connectionState || null;
  }

  getCurrentStream(): MediaStream | null {
    return null;
  }

  setStateChangeHandler(handler: (state: RTCPeerConnectionState) => void) {
    this.onStateChange = handler;
  }

  setDataChannelOpenHandler(handler: () => void) {
    if (this.dc) {
      this.dc.onopen = handler;
    }
  }

  setDataChannelCloseHandler(handler: () => void) {
    if (this.dc) {
      this.dc.onclose = handler;
    }
  }

  setDataChannelMessageHandler(handler: (event: MessageEvent) => void) {
    if (this.dc) {
      this.dc.onmessage = handler;
    }
  }

  setTrackHandler(handler: (e: RTCTrackEvent) => void) {
    this.pc!.ontrack = handler;
  }

  getConnection(): RTCPeerConnection | null {
    return this.pc;
  }
}
