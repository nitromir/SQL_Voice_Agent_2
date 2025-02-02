class OpenAIProvider implements AIProvider {
    async processAudio(audioData: Int16Array): Promise<void> {
        // Преобразуем ArrayBuffer в Int16Array, если необходимо
        if (audioData instanceof ArrayBuffer) {
            audioData = new Int16Array(audioData);
        }
        // ... существующая логика ...
        const buffer = audioData.buffer;
        // ... ваш код ...
    }
}
