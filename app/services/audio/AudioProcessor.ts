export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onAudioData?: (data: Int16Array) => void;
  private onAudioLevel?: (level: number) => void;

  async initialize(): Promise<void> {
    // Create audio context with correct sample rate
    this.audioContext = new AudioContext({
      sampleRate: 24000, // Set to 24kHz as required by OpenAI
      latencyHint: 'interactive'
    });

    console.log('🎵 AudioContext created:', {
      sampleRate: this.audioContext.sampleRate,
      state: this.audioContext.state
    });

    // Load audio worklet
    await this.audioContext.audioWorklet.addModule('/audioProcessor.js');
    console.log('🎵 Audio worklet loaded');

    // Create worklet node with specific options
    this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      processorOptions: {
        sampleRate: 24000
      }
    });

    console.log('🎵 Audio worklet node created');

    // Handle messages from worklet
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'audio' && event.data.audio) {
        console.log('🎵 Received audio data:', {
          bytes: event.data.audio.byteLength,
          level: event.data.level
        });
        
        this.onAudioData?.(event.data.audio);
        this.onAudioLevel?.(event.data.level);
      }
    };
  }

  connectStream(stream: MediaStream): void {
    if (!this.audioContext || !this.workletNode) {
      throw new Error('AudioProcessor not initialized');
    }

    // Disconnect any existing source
    if (this.source) {
      this.source.disconnect();
    }

    // Create and connect new source
    this.source = this.audioContext.createMediaStreamSource(stream);
    console.log('🎵 Media stream source created');
    
    // Connect source directly to worklet
    this.source.connect(this.workletNode);
    console.log('🎵 Audio nodes connected');
  }

  setAudioDataHandler(handler: (data: Int16Array) => void): void {
    this.onAudioData = handler;
  }

  setAudioLevelHandler(handler: (level: number) => void): void {
    this.onAudioLevel = handler;
  }

  cleanup(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('🎵 Audio processor cleaned up');
  }
}
