import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chat } from '@google/genai';
import { InterviewData, ChatMessage, MessageSender, PausedInterview, Screen, User } from '../types';
import { initializeChat, continueChatStream, generateFeedback } from '../services/geminiService';
import ChatMessageBubble from './ChatMessageBubble';
import { SendIcon, BotIcon, PauseIcon, SkipIcon, PreviousIcon, NextIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface InterviewScreenProps {
  user: User;
  interviewData: InterviewData;
  initialMessages: ChatMessage[];
  onShowFeedback: (feedbackText: string, history: ChatMessage[]) => void;
  onPause: (session: PausedInterview) => void;
  onNavigate: (screen: Screen) => void;
  language: string;
}

const InterviewScreen: React.FC<InterviewScreenProps> = ({ 
    user, interviewData, initialMessages, onShowFeedback, onPause, onNavigate, language 
}) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState<number | null>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const questionIndices = useMemo(() => 
    messages.reduce((acc, msg, index) => {
        if (msg.sender === MessageSender.AI && !msg.text.startsWith('###')) {
            acc.push(index);
        }
        return acc;
    }, [] as number[]),
  [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const scrollToRef = (ref: HTMLDivElement | null) => {
      ref?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  useEffect(() => {
    if (reviewQuestionIndex === null && !isLoading) {
      scrollToBottom();
    }
  }, [messages, isWaitingForResponse, isLoading, reviewQuestionIndex]);

  useEffect(() => {
    messageRefs.current = messageRefs.current.slice(0, messages.length);
  }, [messages]);
  
  const initInterview = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { chat: newChat, firstMessage } = await initializeChat(interviewData, language, user.progress, initialMessages);
      setChat(newChat);
      if (firstMessage) {
        setMessages([{ id: Date.now().toString(), sender: MessageSender.AI, text: firstMessage }]);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to start the interview. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [interviewData, language, initialMessages, user.progress]);

  useEffect(() => {
    initInterview();
  }, [initInterview]);
  
  const handleSendMessage = async (e: React.FormEvent | React.MouseEvent, customInput?: string) => {
    e.preventDefault();
    const textToSend = customInput || userInput.trim();
    if (!textToSend || !chat || isWaitingForResponse) return;
    
    setReviewQuestionIndex(null);

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: MessageSender.USER, text: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsWaitingForResponse(true);

    if (textToSend.toLowerCase() === 'end interview') {
      setIsGeneratingFeedback(true);
      try {
        const feedbackText = await generateFeedback(chat, newMessages);
        onShowFeedback(feedbackText, newMessages);
      } catch (err) {
        console.error(err);
        setError('Could not generate feedback. Please try starting a new interview.');
        setIsGeneratingFeedback(false);
      }
      return;
    }

    try {
      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMessageId, sender: MessageSender.AI, text: '' }]);
      
      const stream = continueChatStream(chat, textToSend);
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: fullText } : msg
        ));
      }
    } catch (err) {
      console.error(err);
      setError('There was an error communicating with the AI. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handlePause = () => {
      onPause({ interviewData, messages, language });
      onNavigate(Screen.DASHBOARD);
  }
  
  const handleSkip = (e: React.MouseEvent) => {
      handleSendMessage(e, "Please skip this question.");
  }
  
  const handleBack = () => {
    const currentReviewIdx = reviewQuestionIndex === null ? questionIndices.length : reviewQuestionIndex;
    const nextReviewIdx = Math.max(0, currentReviewIdx - 1);
    if(questionIndices[nextReviewIdx] !== undefined) {
        setReviewQuestionIndex(nextReviewIdx);
        scrollToRef(messageRefs.current[questionIndices[nextReviewIdx]]);
    }
  }

  const handleNext = () => {
    if (reviewQuestionIndex === null) return;
    const nextReviewIdx = Math.min(questionIndices.length - 1, reviewQuestionIndex + 1);
    if (reviewQuestionIndex < questionIndices.length - 1) {
        setReviewQuestionIndex(nextReviewIdx);
        scrollToRef(messageRefs.current[questionIndices[nextReviewIdx]]);
    } else {
        // Reached the end, go back to live
        setReviewQuestionIndex(null);
        scrollToBottom();
    }
  }

  const isReviewing = reviewQuestionIndex !== null;

  if (isLoading) return <LoadingSpinner message="Your interviewer is preparing..."/>;
  if (isGeneratingFeedback) return <LoadingSpinner message="Analyzing your performance and generating feedback..."/>;
  if (error) return <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md"><p className="text-red-500">{error}</p></div>;

  return (
    <div className="flex flex-col h-[90vh] w-full max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <header className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center relative">
         <div className="absolute left-4 flex items-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center mr-2">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-600 dark:text-slate-300">Alex (Interviewer)</span>
          </div>
        <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{interviewData.jobRole}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{interviewData.companyName}</p>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50" onClick={() => setReviewQuestionIndex(null)}>
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div key={message.id} ref={el => { messageRefs.current[index] = el; }}>
                <ChatMessageBubble 
                    message={message} 
                    isHighlighted={isReviewing && questionIndices[reviewQuestionIndex!] === index} 
                    userProfilePicture={user.profilePicture}
                />
            </div>
          ))}
          {isWaitingForResponse && messages[messages.length-1]?.sender === MessageSender.USER && (
            <ChatMessageBubble message={{id: 'thinking', sender: MessageSender.AI, text: '...'}} isTyping={true} />
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex justify-center items-center space-x-2 mb-3">
            <button onClick={handleBack} disabled={isWaitingForResponse || (isReviewing && reviewQuestionIndex === 0) || questionIndices.length < 1} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"><PreviousIcon className="w-5 h-5"/></button>
            <button onClick={handleNext} disabled={!isReviewing || reviewQuestionIndex >= questionIndices.length -1} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"><NextIcon className="w-5 h-5"/></button>
            <button onClick={handleSkip} disabled={isWaitingForResponse || isReviewing} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"><SkipIcon className="w-5 h-5"/></button>
            <button onClick={handlePause} disabled={isWaitingForResponse} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"><PauseIcon className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onFocus={() => setReviewQuestionIndex(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type your answer... or 'End Interview' to finish."
            className="flex-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-600"
            rows={2}
            disabled={isWaitingForResponse || isReviewing}
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!userInput.trim() || isWaitingForResponse || isReviewing}
            className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed transition"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default InterviewScreen;
