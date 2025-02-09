import React from 'react';
import { Message } from '../types';
import { styles, keyframes } from '../styles';

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  if (messages.length === 0) return null;

  // Get only the last message to display
  const lastMessage = messages[messages.length - 1];

  return (
    <>
      <style>
        {keyframes}
      </style>
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div 
          key={lastMessage.id} 
          style={{
            padding: '10px 12px',
            background: lastMessage.type === 'assistant' 
              ? 'rgba(65, 105, 225, 0.15)' 
              : 'rgba(135, 206, 235, 0.15)',
            borderRadius: lastMessage.type === 'assistant'
              ? '16px 16px 16px 4px'
              : '16px 16px 4px 16px',
            fontSize: '0.875rem',
            lineHeight: '1.4',
            color: lastMessage.type === 'assistant' ? '#fff' : '#87CEEB',
            alignSelf: lastMessage.type === 'assistant' ? 'flex-start' : 'flex-end',
            maxWidth: '85%',
            wordWrap: 'break-word',
            animation: 'fadeIn 0.3s ease-out',
            boxShadow: lastMessage.type === 'assistant'
              ? '0 2px 4px rgba(65, 105, 225, 0.1)'
              : '0 2px 4px rgba(135, 206, 235, 0.1)',
            border: lastMessage.type === 'assistant'
              ? '1px solid rgba(65, 105, 225, 0.2)'
              : '1px solid rgba(135, 206, 235, 0.2)',
            backdropFilter: 'blur(8px)',
            marginBottom: '4px',
            position: 'relative',
            transition: 'all 0.2s ease-out',
          }}
        >
          {lastMessage.text}
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            [lastMessage.type === 'assistant' ? 'left' : 'right']: '8px',
            width: '8px',
            height: '8px',
            background: lastMessage.type === 'assistant'
              ? 'rgba(65, 105, 225, 0.15)'
              : 'rgba(135, 206, 235, 0.15)',
            transform: 'rotate(45deg)',
            borderBottom: lastMessage.type === 'assistant'
              ? '1px solid rgba(65, 105, 225, 0.2)'
              : '1px solid rgba(135, 206, 235, 0.2)',
            borderRight: lastMessage.type === 'assistant'
              ? '1px solid rgba(65, 105, 225, 0.2)'
              : '1px solid rgba(135, 206, 235, 0.2)',
          }} />
        </div>
      </div>
    </>
  );
};