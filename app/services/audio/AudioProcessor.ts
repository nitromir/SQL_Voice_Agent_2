export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onAudioData?: (data: ArrayBuffer) => void;
  private onAudioLevel?: (level: number) => void;

  async initialize(): Promise<void> {
    this.audioContext = new AudioContext({
      sampleRate: 24000,
      latencyHint: 'interactive'
    });

    await this.audioContext.audioWorklet.addModule('/audioProcessor.js');

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

    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'audio' && event.data.audio) {
        this.onAudioData?.(event.data.audio);
        this.onAudioLevel?.(event.data.level);
      }
    };
  }

  connectStream(stream: MediaStream): void {
    if (!this.audioContext || !this.workletNode) {
      throw new Error('AudioProcessor not initialized');
    }

    if (this.source) {
      this.source.disconnect();
    }

    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.workletNode);
  }

  setAudioDataHandler(handler: (data: ArrayBuffer) => void): void {
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
  }
}