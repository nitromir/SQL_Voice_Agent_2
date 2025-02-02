class OpenAIProvider extends AIProvider {
    async processAudio(audioData: ArrayBuffer): Promise<void> {
        // Преобразуем ArrayBuffer в Int16Array, если необходимо
        if (audioData instanceof ArrayBuffer) {
            audioData = new Int16Array(audioData);
        }
        // ... существующая логика ...
        const buffer = audioData.buffer;
        // ... ваш код ...
    }
}