export class AudioService {
  private stream: MediaStream | null = null;
  private isMuted: boolean = false;

  async initialize(deviceId?: string): Promise<void> {
    try {
      // Get microphone stream with specific constraints
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        } : {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        }
      });

      // Apply initial mute state
      this.setMuted(this.isMuted);

    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.stream) {
      this.stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  getStream(): MediaStream | null {
    return this.stream;
  }
}
