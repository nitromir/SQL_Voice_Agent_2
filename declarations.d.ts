declare module 'ultravox-client' {
  export interface UltravoxSession {
    // Определите интерфейс UltravoxSession здесь
    peerConnection?: RTCPeerConnection;
    status: UltravoxSessionStatus;
    // Добавьте другие необходимые свойства и методы
  }

  export enum UltravoxSessionStatus {
    DISCONNECTED = 'disconnected',
    DISCONNECTING = 'disconnecting',
    CONNECTING = 'connecting',
    IDLE = 'idle',
    LISTENING = 'listening'
    // Добавьте другие необходимые статусы
  }
} 