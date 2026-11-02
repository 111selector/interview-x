import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chat } from '@google/genai';
import { InterviewData, ChatMessage, MessageSender, PausedInterview, Screen, User } from '../types';
import { initializeChat, continueChatStream, generateFeedback } from '../services/geminiService';
import ChatMessageBubble from './ChatMessageBubble';
import { SendIcon, BotIcon, PauseIcon, SkipIcon, PreviousIcon, NextIcon, MicrophoneIcon, ExitIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import { validateSafeContent } from '../services/contentModeration';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  type SpeechRecognitionErrorCode =
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported';

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    start(): void;
    stop(): void;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };
}

interface InterviewScreenProps {
  user: User;
  interviewData: InterviewData;
  initialMessages: ChatMessage[];
  onShowFeedback: (feedbackText: string, history: ChatMessage[]) => void;
  onPause: (session: PausedInterview) => void;
  onQuit: (discard: boolean) => void;
  onNavigate: (screen: Screen) => void;
  language: string;
  t: (key: string) => string;
}

const InterviewScreen: React.FC<InterviewScreenProps> = ({ 
  user, 
  interviewData, 
  initialMessages, 
  onShowFeedback, 
  onPause, 
  onQuit,
  onNavigate, 
  language, 
  t 
}) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [error, setError] = useState<string>('');
  const [moderationWarning, setModerationWarning] = useState<string>('');
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState<number | null>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Speech-to-Text
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
  };

  useEffect(() => {
    if (reviewQuestionIndex === null && !isLoading) {
      scrollToBottom();
    }
  }, [messages, isWaitingForResponse, isLoading, reviewQuestionIndex]);

  useEffect(() => {
    messageRefs.current = messageRefs.current.slice(0, messages.length);
  }, [messages]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        }
      }
      if (transcript) {
        const mod = validateSafeContent(transcript);
        if (!mod.isClean) {
          setModerationWarning(mod.message || 'Speech contained inappropriate language and was blocked.');
        } else {
          setUserInput(prev => (prev.trim() + ' ' + transcript.trim()).trim());
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access was denied. Please allow it in your browser settings to use this feature.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);
  
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
      setError('Failed to start the interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [interviewData, language, initialMessages, user.progress]);

  useEffect(() => {
    initInterview();
  }, [initInterview]);

  // Live input content check
  const liveModeration = useMemo(() => {
    if (!userInput.trim()) return { isClean: true };
    return validateSafeContent(userInput);
  }, [userInput]);
  
  const handleSendMessage = async (e: React.FormEvent | React.MouseEvent, customInput?: string) => {
    e.preventDefault();
    const textToSend = customInput || userInput.trim();
    if (!textToSend || !chat || isWaitingForResponse) return;
    
    // Strict content moderation check
    const mod = validateSafeContent(textToSend);
    if (!mod.isClean) {
      setModerationWarning(mod.message || 'Inappropriate or offensive language is not permitted.');
      return;
    }
    setModerationWarning('');

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
  };

  const handleConfirmExit = (discard: boolean) => {
    setShowQuitModal(false);
    if (discard) {
      onQuit(true);
    } else {
      onPause({ interviewData, messages, language });
      onQuit(false);
    }
  };
  
  const handleSkip = (e: React.MouseEvent) => {
    handleSendMessage(e, "Please skip this question.");
  };
  
  const handleBack = () => {
    const currentReviewIdx = reviewQuestionIndex === null ? questionIndices.length : reviewQuestionIndex;
    const nextReviewIdx = Math.max(0, currentReviewIdx - 1);
    if(questionIndices[nextReviewIdx] !== undefined) {
      setReviewQuestionIndex(nextReviewIdx);
      scrollToRef(messageRefs.current[questionIndices[nextReviewIdx]]);
    }
  };

  const handleNext = () => {
    if (reviewQuestionIndex === null) return;
    const nextReviewIdx = Math.min(questionIndices.length - 1, reviewQuestionIndex + 1);
    if (reviewQuestionIndex < questionIndices.length - 1) {
      setReviewQuestionIndex(nextReviewIdx);
      scrollToRef(messageRefs.current[questionIndices[nextReviewIdx]]);
    } else {
      setReviewQuestionIndex(null);
      scrollToBottom();
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current || !speechSupported) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setError('');
      setModerationWarning('');
      setReviewQuestionIndex(null);
      recognitionRef.current.start();
    }
  };

  const isReviewing = reviewQuestionIndex !== null;

  if (isLoading) return <LoadingSpinner message="Your interviewer is preparing..." />;
  if (isGeneratingFeedback) return <LoadingSpinner message="Analyzing your performance and generating feedback..." />;

  return (
    <div className="flex flex-col h-[90vh] w-full max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
      {/* Header with Interview details and Quit/Exit Button */}
      <header className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between relative">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
            <BotIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base">Alex (Interviewer)</span>
            <span className="block text-xs text-slate-400">Live AI Coach</span>
          </div>
        </div>

        <div className="text-center hidden sm:block">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{interviewData.jobRole}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{interviewData.companyName}</p>
        </div>

        {/* Quit / Exit Interview Button */}
        <button
          onClick={() => setShowQuitModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-800/60 transition shadow-sm"
          title="Exit or quit interview"
        >
          <ExitIcon className="w-4 h-4" />
          <span>Exit Interview</span>
        </button>
      </header>

      {/* Messages area */}
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

      {/* Moderation Warning Banner */}
      {(!liveModeration.isClean || moderationWarning) && (
        <div className="bg-red-50 dark:bg-red-900/40 border-t border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">⚠️ Warning:</span>
            <span>{moderationWarning || liveModeration.message || 'Inappropriate or adult language is blocked.'}</span>
          </div>
          <button onClick={() => setModerationWarning('')} className="text-red-600 dark:text-red-400 font-bold ml-2">Dismiss</button>
        </div>
      )}

      {/* Footer controls & input */}
      <footer className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-1">
            <button 
              onClick={handleBack} 
              disabled={isWaitingForResponse || (isReviewing && reviewQuestionIndex === 0) || questionIndices.length < 1} 
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
              title="Previous question"
            >
              <PreviousIcon className="w-5 h-5"/>
            </button>
            <button 
              onClick={handleNext} 
              disabled={!isReviewing || reviewQuestionIndex >= questionIndices.length -1} 
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
              title="Next question"
            >
              <NextIcon className="w-5 h-5"/>
            </button>
            <button 
              onClick={handleSkip} 
              disabled={isWaitingForResponse || isReviewing} 
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
              title="Skip question"
            >
              <SkipIcon className="w-5 h-5"/>
            </button>
            <button 
              onClick={handlePause} 
              disabled={isWaitingForResponse} 
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-600 dark:text-slate-300"
              title="Pause and return to dashboard"
            >
              <PauseIcon className="w-5 h-5"/>
            </button>
          </div>

          <button
            onClick={() => handleSendMessage({ preventDefault: () => {} } as any, 'End Interview')}
            disabled={isWaitingForResponse}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
          >
            Finish & Get Feedback
          </button>
        </div>

        {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}

        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 sm:space-x-3">
          <textarea
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              if (moderationWarning) setModerationWarning('');
            }}
            onFocus={() => setReviewQuestionIndex(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type your response... (insults, inappropriate or adult words will be blocked)"
            className={`flex-1 w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-600 ${
              !liveModeration.isClean ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
            rows={2}
            disabled={isWaitingForResponse || isReviewing}
          />

          <button
            type="button"
            aria-label={t('micButtonLabel')}
            onClick={handleMicClick}
            disabled={!speechSupported || isWaitingForResponse || isReviewing}
            title={!speechSupported ? "Speech recognition not supported in this browser" : t('micButtonLabel')}
            className={`p-3 rounded-full transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <MicrophoneIcon className="w-5 h-5" />
          </button>

          <button
            type="submit"
            aria-label="Send message"
            disabled={!userInput.trim() || !liveModeration.isClean || isWaitingForResponse || isReviewing}
            className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition shadow-md"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </footer>

      {/* Quit / Exit Modal */}
      {showQuitModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600 dark:text-red-400">
              <ExitIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-1">
              Quit Interview
            </h3>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
              Would you like to pause and save your progress, or exit and discard this interview?
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmExit(false)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm"
              >
                Save & Exit to Dashboard
              </button>
              <button
                type="button"
                onClick={() => handleConfirmExit(true)}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition shadow-sm"
              >
                Quit & Discard Session
              </button>
              <button
                type="button"
                onClick={() => setShowQuitModal(false)}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition"
              >
                Cancel & Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewScreen;