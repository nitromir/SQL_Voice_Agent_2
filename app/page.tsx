"use client";

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
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const mics = devices.filter(device => device.kind === 'audioinput');
        setAvailableMicrophones(mics);
        if (mics.length > 0) {
          setSelectedMicrophone(mics[0].deviceId);
        }
      })
      .catch(error => {
        console.error('Error getting devices:', error);
      });
  }, []);

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
      position: 'relative',
      overflow: 'hidden',
      background: '#000',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
    }}>
      <Background />
      
      <div style={{
        position: 'fixed',
        top: '1rem',
        left: '1.5rem',
        width: '40px',
        height: '40px',
        transition: 'opacity 0.2s ease-out',
        cursor: 'pointer',
        opacity: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}>
        <svg 
          viewBox="0 0 24 24" 
          width="100%" 
          height="100%" 
          fill="none" 
          stroke="#4169E1" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M23 6l-9.5 9.5-5-5L1 18" />
          <path d="M17 6h6v6" />
        </svg>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        marginTop: '1rem',
        marginBottom: '0.5rem',
      }}>
        <h1 style={{
          fontSize: 'clamp(1.25rem, 4vw, 2rem)',
          fontWeight: 'bold',
          color: '#4169E1',
          animation: 'titleGlow 2s ease-in-out infinite',
          marginBottom: '0.25rem',
          lineHeight: 1.2,
          padding: '0 1rem',
        }}>Vladislav Olegovich AI Solutions</h1>
        <h2 style={{
          fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
          color: '#87CEEB',
          fontWeight: '500',
          opacity: 0.9,
          marginBottom: '0.25rem',
        }}>Where voices meet intelligence.</h2>
      </div>

      {/* Phone Container */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '300px',
        height: '600px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '40px',
        border: '2px solid rgba(65, 105, 225, 0.3)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 30px rgba(65, 105, 225, 0.1)',
        zIndex: 2,
        overflow: 'hidden',
        '@media (max-height: 700px)': {
          height: '80vh',
          maxHeight: '500px',
        }
      }}>
        {/* Phone Notch */}
        <div style={{
          width: '120px',
          height: '25px',
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '0 0 20px 20px',
          margin: '0 auto',
        }} />
        
        {/* Messages Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '10px 15px',
          display: 'flex',
          flexDirection: 'column',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          '::-webkit-scrollbar': {
            display: 'none'
          }
        }}>
          <MessageList messages={messages} />
          {currentVisualization && (
            <div style={{
              width: '100%',
              opacity: isVisualizationFading ? 0 : 1,
              transition: 'opacity 2s ease-out',
              marginTop: '10px',
            }}>
              <DataVisualization visualization={currentVisualization} />
            </div>
          )}
        </div>
        
        {/* Phone Home Indicator */}
        <div style={{
          width: '40%',
          height: '4px',
          background: 'rgba(65, 105, 225, 0.3)',
          borderRadius: '2px',
          margin: '10px auto',
        }} />
      </div>

      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value as 'openai' | 'ultravox')}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1.5rem',
          zIndex: 100,
          padding: '0.5rem',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(65, 105, 225, 0.2)',
          borderRadius: '0.5rem',
          color: '#4169E1',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease-out',
          WebkitAppearance: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234169E1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1rem',
          paddingRight: '2rem',
        }}
      >
        <option value="openai" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: '#4169E1',
          fontSize: '1rem'
        }}>OpenAI</option>
        <option value="ultravox" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: '#4169E1',
          fontSize: '1rem'
        }}>Ultravox</option>
      </select>

      <MicButton 
        isMicActive={isMicActive}
        isProcessing={isProcessing}
        onClick={handleMicToggle}
        hasMessages={messages.length > 0}
        lastMessageIsAssistant={messages.length > 0 && messages[messages.length - 1].type === 'assistant'}
        isMuted={isMuted}
        onMuteToggle={toggleMute}
      />

      {debugInfo.lastError && (
        <div style={{
          position: 'fixed',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '280px',
          minHeight: '80px',
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
            fontSize: '0.875rem',
            color: '#fff',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(65, 105, 225, 0.2)',
          }}>Error: {debugInfo.lastError}</div>
        </div>
      )}
    </main>
  );
}