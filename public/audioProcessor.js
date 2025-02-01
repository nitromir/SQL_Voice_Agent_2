class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // 1. Добавим конфигурацию по умолчанию
    this.config = {
      sampleRate: options?.processorOptions?.sampleRate || 24000,
      bufferSize: 4096, // Рекомендуем оставить степень двойки
      silenceThreshold: 0.003, // Оптимизированный порог тишины
      gain: 1.2, // Более безопасное усиление
      minChunkDuration: 0.1 // Минимальная длительность сегмента в секундах
    };

    // 2. Инициализация буферов
    this.buffer = new Float32Array(this.config.bufferSize);
    this.bufferIndex = 0;
    this.silenceCounter = 0;
    this.lastProcessTime = 0;
  }

  // 3. Улучшенная конвертация в PCM
  floatTo16BitPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    const scale = 0x7FFF; // Максимальное значение для 16-битного знакового
    
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.min(1, Math.max(-1, float32Array[i] * this.config.gain));
      view.setInt16(i * 2, s * scale, true);
    }
    
    return buffer;
  }

  // 4. Обновленный алгоритм VAD (Voice Activity Detection)
  calculateRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    const now = currentTime;
    const timeSinceLastProcess = now - this.lastProcessTime;
    this.lastProcessTime = now;

    // 5. Обработка входных данных
    for (let i = 0; i < input.length; i++) {
      this.buffer[this.bufferIndex++] = input[i];

      if (this.bufferIndex >= this.config.bufferSize) {
        const audioChunk = this.buffer.slice();
        const rms = this.calculateRMS(audioChunk);
        const isSpeech = rms > this.config.silenceThreshold;

        // 6. Логика подавления шума
        if (isSpeech) {
          this.silenceCounter = 0;
          const pcmBuffer = this.floatTo16BitPCM(audioChunk);
          
          this.port.postMessage({
            type: 'audio',
            data: pcmBuffer,
            rms: rms,
            sampleRate: this.config.sampleRate,
            timestamp: now
          }, [pcmBuffer]);
        } else {
          this.silenceCounter++;
        }

        // 7. Сброс буфера
        this.buffer = new Float32Array(this.config.bufferSize);
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

// 8. Регистрация процессора
try {
  registerProcessor('audio-processor', AudioProcessor);
} catch (error) {
  console.error('Failed to register processor:', error);
}
