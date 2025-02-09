import React from 'react';
import { styles } from '../styles';

interface MicButtonProps {
  isMicActive: boolean;
  isProcessing: boolean;
  onClick: () => void;
  hasMessages: boolean;
  lastMessageIsAssistant: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({
  isMicActive,
  isProcessing,
  onClick,
  hasMessages,
  lastMessageIsAssistant,
  isMuted,
  onMuteToggle,
}) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      zIndex: 100,
    }}>
      {/* Mute Button */}
      <div 
        onClick={onMuteToggle}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: isMuted ? '#ff4b4b' : 'rgba(65, 105, 225, 0.1)',
          border: '1px solid rgba(65, 105, 225, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease-out',
          '@media (min-width: 768px)': {
            width: '50px',
            height: '50px'
          }
        }}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none"
          style={{
            transition: 'transform 0.3s ease-out',
            opacity: isMuted ? 1 : 0.6,
            '@media (min-width: 768px)': {
              width: '24px',
              height: '24px'
            }
          }}
        >
          <path 
            d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9l4.19 4.18L21 20.73 4.27 3z"
            fill={isMuted ? '#fff' : '#4169E1'}
          />
        </svg>
      </div>

      {/* Mic Button */}
      <div 
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'rgba(65, 105, 225, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: '2px solid rgba(65, 105, 225, 0.3)',
          transform: isMicActive ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isMicActive ? '0 0 30px rgba(65, 105, 225, 0.3)' : 'none',
          '@media (min-width: 768px)': {
            width: '90px',
            height: '90px'
          }
        }}
        onClick={onClick}
      >
        {isProcessing && (
          <div 
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: '3px solid rgba(65, 105, 225, 0.1)',
              borderTop: '3px solid #4169E1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} 
          />
        )}
        <svg 
          style={{
            width: '35px',
            height: '35px',
            color: '#4169E1',
            transition: 'all 0.3s ease',
            animation: (isMicActive || (hasMessages && lastMessageIsAssistant)) 
              ? 'pulseScale 1s ease-in-out infinite' 
              : 'none',
            '@media (min-width: 768px)': {
              width: '50px',
              height: '50px'
            }
          }} 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V21h2v-3.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </div>
    </div>
  );
};