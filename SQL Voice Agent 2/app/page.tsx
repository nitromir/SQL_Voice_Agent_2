"use client"

import { useEffect, useState } from 'react';
import { MicButton } from './components/MicButton';
import { MessageList } from './components/MessageList';
import { Background } from './components/Background';
import DataVisualization from './components/DataVisualization';
import { useAIVoiceChat } from './hooks/useAIVoiceChat';

export default function Home() {
  const {
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
  } = useAIVoiceChat();

  const [availableMicrophones, setAvailableMicrophones] = useState<Array<{
    deviceId: string;
    label: string;
  }>>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');

  useEffect(() => {
    // Get available microphones
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const mics = devices.filter(device => device.kind === 'audioinput');
        console.log('Available microphones:', mics);
        setAvailableMicrophones(mics);
        if (mics.length > 0) {
          setSelectedMicrophone(mics[0].deviceId);
        }
      })
      .catch(error => {
        console.error('Error getting devices:', error);
      });
  }, []); // Only run once on mount

  const handleMicToggle = async () => {
    if (!isMicActive) {
      await startRecording();
    } else {
      stopRecording();
    }
  };

  return (
    <main style={{
      height: '100vh',
      maxHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      background: '#000',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
    }}>
      <Background />
      
      {/* Logo */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        left: '3rem',
        width: '150px',
        height: '80px',
        transition: 'opacity 0.2s ease-out',
        cursor: 'pointer',
        opacity: 1,
      }}>
        <img 
          src="/logo.png"
          alt="Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>

      <h1 style={{
        position: 'relative',
        zIndex: 2,
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#ffc000',
        marginBottom: '1.5rem',
        animation: 'titleGlow 2s ease-in-out infinite',
        textAlign: 'center',
        marginTop: '0.1rem',
      }}>SQL Voice Agent</h1>

      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: '90px',
        gap: '2rem',
      }}>
        <div style={{
          width: currentVisualization ? '45%' : '100%',
          transition: 'all 0.3s ease-out',
          display: 'flex',
          justifyContent: 'center',
          paddingLeft: currentVisualization ? '2rem' : '0',
        }}>
          <div style={{ 
            width: '100%',
            display: 'flex',
            justifyContent: currentVisualization ? 'flex-start' : 'center',
          }}>
            <MessageList messages={messages} />
          </div>
        </div>
        
        {currentVisualization && (
          <div style={{
            width: '45%',
            opacity: isVisualizationFading ? 0 : 1,
            transition: 'opacity 2s ease-out',
            display: 'flex',
            justifyContent: 'flex-start',
            paddingRight: '2rem',
          }}>
            <DataVisualization visualization={currentVisualization} />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <div className="flex flex-col items-center space-y-10 z-10">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as 'openai' | 'ultravox')}
            style={{
              position: 'fixed',
              top: '2rem',
              right: '3rem',
              zIndex: 100,
              padding: '0.5rem 1.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 192, 0, 0.2)',
              borderRadius: '0.5rem',
              color: '#ffc000',
              fontSize: '1rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease-out',
              WebkitAppearance: 'none',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffc000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1rem',
              paddingRight: '2rem'
            }}
          >
            <option value="openai" style={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: '#ffc000',
              fontSize: '1rem'
            }}>OpenAI</option>
            <option value="ultravox" style={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: '#ffc000',
              fontSize: '1rem'
            }}>Ultravox</option>
          </select>

          {/* Microphone Selection Dropdown */}
          {/* <div className="flex items-center space-x-2">
            <select
              value={selectedMicrophone}
              onChange={(e) => setSelectedMicrophone(e.target.value)}
              style={{
                padding: '0.5rem 2rem',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 192, 0, 0.2)',
                borderRadius: '0.5rem',
                color: '#ffc000',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease-out',
                WebkitAppearance: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffc000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1rem',
                paddingRight: '2rem',
                minWidth: '200px'
              }}
            >
              {availableMicrophones.map((mic, index) => (
                <option key={index} value={mic.deviceId} style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  color: '#ffc000',
                  fontSize: '0.9rem'
                }}>{mic.label}</option>
              ))}
            </select>
          </div> */}
        </div>

        <MicButton 
          isMicActive={isMicActive}
          isProcessing={isProcessing}
          onClick={handleMicToggle}
          hasMessages={messages.length > 0}
          lastMessageIsAssistant={messages.length > 0 && messages[messages.length - 1].type === 'assistant'}
          isMuted={isMuted}
          onMuteToggle={toggleMute}
        />
      </div>

      {debugInfo.lastError && (
        <div style={{
          position: 'fixed',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: '800px',
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '1rem',
          borderRadius: '0.5rem',
          zIndex: 10,
        }}>
          <div style={{
            fontSize: '1rem',
            color: '#fff',
            textShadow: '0 0 10px rgba(255, 204, 0, 0.2)',
          }}>Error: {debugInfo.lastError}</div>
        </div>
      )}
    </main>
  );
}