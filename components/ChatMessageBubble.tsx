import React from 'react';
import { ChatMessage, MessageSender } from '../types';
import { BotIcon, UserIcon } from './icons';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isTyping?: boolean;
  isHighlighted?: boolean;
  userProfilePicture?: string;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, isTyping = false, isHighlighted = false, userProfilePicture }) => {
  const isUser = message.sender === MessageSender.USER;

  const bubbleClasses = isUser
    ? 'bg-indigo-600 text-white'
    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100';
  
  const containerClasses = isUser ? 'justify-end' : 'justify-start';

  const Avatar = () => (
    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${isUser ? 'bg-indigo-200 text-indigo-700 ml-3' : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-200 mr-3'}`}>
      {isUser ? (
        userProfilePicture ? <img src={userProfilePicture} alt="User" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6" />
      ) : (
        <BotIcon className="w-6 h-6" />
      )}
    </div>
  );
  
  const formattedText = message.text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < message.text.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  const TypingIndicator = () => (
    <div className="flex items-center justify-center space-x-1 p-2">
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0s]"></span>
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.1s]"></span>
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
    </div>
  );

  return (
    <div className={`flex items-start ${containerClasses} ${isHighlighted ? 'scale-105 transition-transform duration-300' : ''}`}>
      {!isUser && <Avatar />}
      <div
        className={`px-4 py-3 rounded-2xl max-w-xl md:max-w-2xl ${bubbleClasses} ${isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900' : ''}`}
        style={{
          borderTopLeftRadius: isUser ? '1rem' : '0.25rem',
          borderTopRightRadius: isUser ? '0.25rem' : '1rem',
        }}
      >
        {isTyping ? <TypingIndicator /> : <p className="whitespace-pre-wrap">{formattedText}</p>}
      </div>
      {isUser && <Avatar />}
    </div>
  );
};

export default ChatMessageBubble;