import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioService } from '../services/audio/AudioService';
import { OpenAIProvider } from '../services/ai/openai';
import { UltravoxProvider } from '../services/ai/ultravox-provider';
import { Message, Visualization, DebugInfo, AIProvider, ConnectionState } from '../types';

export type AIModel = 'openai' | 'ultravox';

export function useAIVoiceChat() {
  // State
  const [isMicActive, setIsMicActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [isConnected, setIsConnected] = useState(false);
  const [currentVisualization, setCurrentVisualization] = useState<Visualization | null>(null);
  const [isVisualizationFading, setIsVisualizationFading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('openai');

  // Services
  const audioService = useRef(new AudioService());
  const aiProvider = useRef<AIProvider | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);

  // Debug logger
  const logDebug = useCallback((action: string, ...args: any[]) => {
    console.log(action, ...args);
    setDebugInfo(prev => ({
      ...prev,
      lastAction: action
    }));
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (aiProvider.current) {
      aiProvider.current.disconnect();
      aiProvider.current = null;
    }

    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach(track => track.stop());
      currentStreamRef.current = null;
    }

    if (audioService.current) {
      audioService.current.cleanup();
    }

    setIsMicActive(false);
    setIsConnected(false);
    setMessages([]);
  }, []);

  // Handle connection state change
  const handleConnectionStateChange = useCallback((state: ConnectionState) => {
    logDebug(`Connection state changed: ${state}`);
    setIsConnected(state === 'connected');
    if (state === 'failed') {
      setDebugInfo(prev => ({
        ...prev,
        lastError: `Connection failed`,
        lastAction: `Connection failed`
      }));
      cleanup();
    } else if (state === 'disconnected') {
      cleanup();
    }
  }, [logDebug, cleanup]);

  // Handle message
  const handleMessage = useCallback((message: Message) => {
    logDebug('Received message:', message);
    if (message.delta) {
      setMessages(prev => {
        const existingMessage = prev.find(m => m.id === message.id && m.partial);
        if (existingMessage) {
          return prev.map(m => 
            m.id === message.id
              ? { ...m, text: m.text + message.text }
              : m
          );
        } else {
          return [...prev, message];
        }
      });
    } else {
      if (message.partial) {
        setMessages(prev => [...prev, message]);
      } else {
        setMessages(prev => {
          const filteredMessages = prev.filter(m => m.id !== message.id);
          return [...filteredMessages, message];
        });
      }
    }
  }, [logDebug]);

  // Handle visualization
  const handleVisualization = useCallback((visualization: Visualization | null) => {
    setCurrentVisualization(visualization);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setIsProcessing(true);
      setDebugInfo({}); // Clear previous errors

      // Create new provider instance if needed
      if (!aiProvider.current) {
        aiProvider.current = selectedModel === 'openai' 
          ? new OpenAIProvider()
          : new UltravoxProvider();

        // Set up handlers
        aiProvider.current.setStateChangeHandler(handleConnectionStateChange);
        aiProvider.current.setMessageHandler(handleMessage);
        aiProvider.current.setVisualizationHandler(handleVisualization);
        aiProvider.current.setDebugHandler(setDebugInfo);

        try {
          // Connect to AI provider
          await aiProvider.current.connect();
          
          // Wait for connection to be established
          const connectionTimeout = 10000; // 10 seconds timeout
          const startTime = Date.now();
          
          while (Date.now() - startTime < connectionTimeout) {
            if (aiProvider.current.isConnected()) {
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          if (!aiProvider.current.isConnected()) {
            throw new Error('Connection timeout - connection not established');
          }
        } catch (error) {
          logDebug('Connection error:', error);
          setDebugInfo(prev => ({
            ...prev,
            lastError: error instanceof Error ? error.message : String(error),
            lastAction: 'Failed to establish connection'
          }));
          cleanup();
          return;
        }
      }

      // Stop any existing stream
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
        currentStreamRef.current = null;
      }

      // Initialize audio to get user permission
      await audioService.current.initialize();
      const stream = audioService.current.getStream();
      
      if (!stream) {
        throw new Error('Failed to get audio stream');
      }

      currentStreamRef.current = stream;
      const audioTrack = stream.getAudioTracks()[0];
      
      if (!audioTrack) {
        throw new Error('No audio track available');
      }

      // Add the track to the connection
      if (aiProvider.current) {
        await aiProvider.current.addAudioTrack(audioTrack, stream);
      }

      // Apply initial mute state
      audioService.current.setMuted(isMuted);

      setIsMicActive(true);
      logDebug('Microphone active');

    } catch (error) {
      logDebug('Failed to start recording:', error);
      setDebugInfo(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : String(error),
        lastAction: 'Failed to start recording'
      }));
      cleanup();
    } finally {
      setIsProcessing(false);
    }
  }, [selectedModel, cleanup, handleConnectionStateChange, handleMessage, handleVisualization, logDebug, isMuted]);

  // Stop recording
  const stopRecording = useCallback(() => {
    cleanup();
    logDebug('Recording stopped');
  }, [cleanup, logDebug]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (audioService.current) {
      const newMuteState = !isMuted;
      audioService.current.setMuted(newMuteState);
      setIsMuted(newMuteState);
      logDebug(`Microphone ${newMuteState ? 'muted' : 'unmuted'}`);
    }
  }, [isMuted, logDebug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Visualization effect
  useEffect(() => {
    let fadeTimeout: NodeJS.Timeout;
    let removeTimeout: NodeJS.Timeout;

    if (currentVisualization) {
      fadeTimeout = setTimeout(() => {
        setIsVisualizationFading(true);
        
        removeTimeout = setTimeout(() => {
          setCurrentVisualization(null);
          setIsVisualizationFading(false);
        }, 1500);
      }, 15000);
    }

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, [currentVisualization]);

  return {
    isMicActive,
    isProcessing,
    isConnected,
    isMuted,
    messages,
    debugInfo,
    currentVisualization,
    isVisualizationFading,
    selectedModel,
    setSelectedModel,
    startRecording,
    stopRecording,
    toggleMute
  };
}
