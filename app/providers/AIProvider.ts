interface AIProvider {
    processAudio(audioData: Int16Array): Promise<void>;
}
