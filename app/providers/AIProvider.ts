export interface AIProvider {
    processAudio(audioData: ArrayBuffer): Promise<void>;
}
