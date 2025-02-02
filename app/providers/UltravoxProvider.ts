class UltravoxProvider implements AIProvider {
    async processAudio(audioData: Int16Array): Promise<void> {
        const buffer = audioData.buffer;
        // ... ваш код ...
    }
} 