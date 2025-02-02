import React from 'react';
import { Message } from '../types';
import { styles, keyframes } from '../styles';

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  if (messages.length === 0) return null;

  const lastMessage = messages[messages.length - 1];

  return (
    <>
      <style>
        {keyframes}
      </style>
      <div style={styles.responseContainer}>
        <div 
          key={lastMessage.id} 
          style={{
            ...styles.messageContainer,
            ...(lastMessage.type === 'assistant' ? styles.assistantMessage : styles.userMessage),
          }}
        >
          {lastMessage.text}
        </div>
      </div>
    </>
  );
};
