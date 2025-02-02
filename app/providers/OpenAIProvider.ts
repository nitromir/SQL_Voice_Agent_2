class OpenAIProvider implements AIProvider {
    async processAudio(audioData: Int16Array | ArrayBuffer): Promise<void> {
        if (audioData instanceof Int16Array) {
            // Преобразуем Int16Array в ArrayBuffer, если это необходимо
            const buffer = audioData.buffer.slice(
                audioData.byteOffset,
                audioData.byteOffset + audioData.byteLength
            );
            // ... existing code ...
        } else if (audioData instanceof ArrayBuffer) {
            // ... existing code ...
        }
    }
}