import { AIProvider, ConnectionState, Message, DebugInfo, Visualization } from '../services/ai/types';
import { AudioProcessor } from '../services/ai/audio/AudioProcessor';
import { UltravoxSession, UltravoxSessionStatus } from 'ultravox-client';

type Role = 'user' | 'agent';
type Medium = 'voice' | 'text';

interface Transcript {
  text: string;
  isFinal: boolean;
  speaker: Role;
  medium: Medium;
}

export class UltravoxProvider implements AIProvider {
    private audioElement: HTMLAudioElement | null = null;
    private audioProcessor: AudioProcessor | null = null;
    private sessionId: number | null = null;
    private ultravoxSession: UltravoxSession | null = null;
    private connectionState: ConnectionState = 'new';
    private stateChangeHandler?: (state: ConnectionState) => void;
    private messageHandler?: (message: Message) => void;
    private visualizationHandler?: (visualization: Visualization | null) => void;
    private debugHandler?: (info: DebugInfo) => void;
    private mediaStream: MediaStream | null = null;

    constructor() {
        this.audioElement = new Audio();
        this.audioElement.autoplay = true;
        this.audioProcessor = new AudioProcessor();
        this.sessionId = Math.floor(Math.random() * 1000000);
    }

    private logDebug(action: string, ...args: any[]) {
        console.log(action, ...args);
        if (this.debugHandler) {
            this.debugHandler({ lastAction: action });
        }
    }

    private mapUltravoxStatusToConnectionState(status: UltravoxSessionStatus): ConnectionState {
        switch (status) {
            case UltravoxSessionStatus.DISCONNECTED:
                return 'disconnected';
            case UltravoxSessionStatus.DISCONNECTING:
                return 'disconnected';
            case UltravoxSessionStatus.CONNECTING:
                return 'connecting';
            case UltravoxSessionStatus.IDLE:
            case UltravoxSessionStatus.LISTENING:
                // ... ваш код ...
                break;
        }
        return 'disconnected'; // По умолчанию
    }

    async connect(): Promise<void> {
        if (this.ultravoxSession) {
            throw new Error('Ultravox session already exists');
        }

        try {
            this.ultravoxSession = await UltravoxSession.create(this.sessionId);
            this.connectionState = 'connecting';
            this.logDebug('Connecting to Ultravox');

            // Обработка изменений состояния сессии
            this.ultravoxSession.onStatusChange((status: UltravoxSessionStatus) => {
                const newState = this.mapUltravoxStatusToConnectionState(status);
                if (this.connectionState !== newState) {
                    this.connectionState = newState;
                    this.logDebug('Connection state changed:', newState);
                    if (this.stateChangeHandler) {
                        this.stateChangeHandler(newState);
                    }
                }
            });

            // Подключение к сессии
            await this.ultravoxSession.connect();
        } catch (error) {
            this.logDebug('Error connecting to Ultravox:', error);
            throw error;
        }
    }

    disconnect(): void {
        if (!this.ultravoxSession) {
            return;
        }

        try {
            this.ultravoxSession.disconnect();
            this.connectionState = 'disconnected';
            this.logDebug('Disconnected from Ultravox');
        } catch (error) {
            this.logDebug('Error disconnecting from Ultravox:', error);
        } finally {
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
                this.mediaStream = null;
            }
            this.ultravoxSession = null;
        }
    }

    isConnected(): boolean {
        return this.connectionState === 'connected';
    }

    async processAudio(audioData: Int16Array): Promise<void> {
        if (audioData instanceof ArrayBuffer) {
            audioData = new Int16Array(audioData);
        }
        // ... ваш код обработки ...
        if (this.audioProcessor) {
            this.audioProcessor.processAudioData(audioData);
        }
    }

    async addAudioTrack(track: MediaStreamTrack, stream: MediaStream): Promise<void> {
        if (!this.ultravoxSession) {
            throw new Error('No active Ultravox session');
        }

        try {
            // Store the media stream for cleanup
            this.mediaStream = stream;

            // Add the audio track to the WebRTC connection
            const pc = (this.ultravoxSession as any).peerConnection;
            if (pc) {
                stream.getTracks().forEach(track => {
                    pc.addTrack(track, stream);
                });
            }
            
            this.logDebug('Added audio track to Ultravox session');
        } catch (error) {
            this.logDebug('Error adding audio track:', error);
            throw error;
        }
    }

    setStateChangeHandler(handler: (state: ConnectionState) => void): void {
        this.stateChangeHandler = handler;
    }

    setMessageHandler(handler: (message: Message) => void): void {
        this.messageHandler = handler;
    }

    setVisualizationHandler(handler: (visualization: Visualization | null) => void): void {
        this.visualizationHandler = handler;
    }

    setDebugHandler(handler: (info: DebugInfo) => void): void {
        this.debugHandler = handler;
    }
} 
