class OpenAIProvider implements AIProvider {
    async processAudio(audioData: Int16Array): Promise<void> {
        // Преобразование ArrayBuffer в Int16Array, если необходимо
        if (audioData instanceof ArrayBuffer) {
            audioData = new Int16Array(audioData);
        }
        // ... existing code ...
    }
}
