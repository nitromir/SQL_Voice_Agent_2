import React from 'react';
import { Message } from '../types';
import styles from '../styles/MessageList.module.css';

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  if (messages.length === 0) return null;

  // Get only the last message to display
  const lastMessage = messages[messages.length - 1];

  return (
    <>
      <div className={styles.messageContainer}>
        <div 
          key={lastMessage.id} 
          className={`${styles.message} ${lastMessage.type === 'assistant' ? styles.assistant : styles.user}`}
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