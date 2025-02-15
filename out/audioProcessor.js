class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleRate = (options?.processorOptions?.sampleRate || 24000);
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.gain = 1.5;
  }

  // Convert Float32Array to PCM16 ArrayBuffer
  floatTo16BitPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    
    const channel = input[0];
    if (!channel) return true;

    // Fill buffer with incoming audio data
    for (let i = 0; i < channel.length; i++) {
      // Apply gain and clip to [-1, 1]
      const sample = Math.max(-1, Math.min(1, channel[i] * this.gain));
      this.buffer[this.bufferIndex++] = sample;
      
      // When buffer is full, process and send it
      if (this.bufferIndex >= this.bufferSize) {
        // Get a copy of the current buffer
        const audioData = this.buffer.slice();
        
        // Calculate RMS for voice activity detection
        let rms = 0;
        for (let j = 0; j < this.bufferSize; j++) {
          rms += audioData[j] * audioData[j];
        }
        rms = Math.sqrt(rms / this.bufferSize);
        
        // Only send if we detect voice activity
        if (rms > 0.005) {
          // Convert to PCM16 ArrayBuffer
          const pcmBuffer = this.floatTo16BitPCM(audioData);
          
          // Send the PCM data
          this.port.postMessage({
            type: 'audio',
            audio: pcmBuffer,
            level: rms
          }, [pcmBuffer]);
        }
        
        // Reset buffer
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
