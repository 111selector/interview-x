import React, { useState, useCallback, useEffect } from 'react';
import { 
  Screen, 
  Plan, 
  User, 
  InterviewData, 
  ChatMessage, 
  Theme, 
  PausedInterview, 
  TestQuestion, 
  TestResult, 
  UserAnswer, 
  InterviewRecord 
} from './types';
import { languages, translations } from './i18n';
import { generateTest, gradeTest } from './services/geminiService';
import { 
  auth, 
  getOrCreateUserProfile, 
  updateUserProfile, 
  saveCompletedInterview, 
  getUserInterviewHistory, 
  saveUserPausedSession, 
  getUserPausedSession, 
  clearUserPausedSession, 
  logOut 
} from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Header from './components/Header';
import LandingScreen from './components/LandingScreen';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import PlansScreen from './components/PlansScreen';
import PaymentScreen from './components/PaymentScreen';
import SetupForm from './components/SetupForm';
import InterviewScreen from './components/InterviewScreen';
import FeedbackScreen from './components/FeedbackScreen';
import ProfileScreen from './components/ProfileScreen';
import TestScreen from './components/TestScreen';
import TestResultScreen from './components/TestResultScreen';
import ResourcesScreen from './components/ResourcesScreen';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.LANDING);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('preferredLanguage') || 'en');
  const [theme, setTheme] = useState<Theme>(localStorage.theme || Theme.LIGHT);

  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [pausedInterview, setPausedInterview] = useState<PausedInterview | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewRecord[]>([]);

  // State for promotion test
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Theme Sync
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Language Sync
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  // Helper to load user's private isolated data from Firestore
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [history, paused] = await Promise.all([
        getUserInterviewHistory(userId),
        getUserPausedSession(userId),
      ]);
      setInterviewHistory(history);
      setPausedInterview(paused);
    } catch (e) {
      console.error("Failed to load user's private data from Firestore:", e);
    }
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await getOrCreateUserProfile(fbUser);
          setUser(profile);
          setIsAuthenticated(true);
          await loadUserData(fbUser.uid);
          // If on landing or login, navigate to dashboard
          setScreen(prev => (prev === Screen.LOGIN || prev === Screen.LANDING ? Screen.DASHBOARD : prev));
        } catch (e) {
          console.error("Error setting up authenticated user profile:", e);
        }
      } else {
        // Logged out: Clear all user-specific data to enforce strict privacy between accounts
        setUser(null);
        setIsAuthenticated(false);
        setInterviewHistory([]);
        setPausedInterview(null);
        setChatHistory([]);
        setFeedback('');
        setInterviewData(null);
        setScreen(prev => {
          const authRequired = ![Screen.LANDING, Screen.LOGIN, Screen.PLANS].includes(prev);
          return authRequired ? Screen.LANDING : prev;
        });
      }
    });

    return () => unsubscribe();
  }, [loadUserData]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  }, []);

  const t = useCallback((key: keyof typeof translations) => {
    const translationSet = translations as any;
    return translationSet[key]?.[language] || translations[key]?.['en'] || key;
  }, [language]);

  const handleNavigate = useCallback((newScreen: Screen) => {
    const authRequired = ![Screen.LANDING, Screen.LOGIN, Screen.PLANS].includes(newScreen);
    if (authRequired && !isAuthenticated) {
      setScreen(Screen.LOGIN);
      return;
    }
    
    setError('');
    setScreen(newScreen);
  }, [isAuthenticated]);
  
  const handleClearPausedInterview = useCallback(async () => {
    if (user?.id) {
      await clearUserPausedSession(user.id);
    }
    setPausedInterview(null);
  }, [user]);

  const handleLoginSuccess = useCallback(async (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    if (loggedInUser.id) {
      await loadUserData(loggedInUser.id);
    }
    setScreen(Screen.DASHBOARD);
  }, [loadUserData]);

  const handleLogout = useCallback(async () => {
    try {
      await logOut();
    } catch (e) {
      console.error("Error during sign out:", e);
    }
    setUser(null);
    setIsAuthenticated(false);
    setInterviewHistory([]);
    setPausedInterview(null);
    setScreen(Screen.LANDING);
  }, []);
  
  const handleUpdateUser = useCallback(async (updatedUserData: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUserData };
      setUser(newUser);
      if (user.id) {
        try {
          await updateUserProfile(user.id, updatedUserData);
        } catch (e) {
          console.error("Failed to update user profile in Firestore:", e);
        }
      }
    }
  }, [user]);

  const handlePlanChange = useCallback((newPlan: Plan) => {
    if (user) {
      handleUpdateUser({ plan: newPlan, downloadsUsed: 0 });
      handleNavigate(Screen.DASHBOARD);
    }
  }, [user, handleUpdateUser, handleNavigate]);

  const handleStartInterview = useCallback(async (data: InterviewData) => {
    await handleClearPausedInterview();
    setInterviewData(data);
    setChatHistory([]);
    setFeedback('');
    handleNavigate(Screen.INTERVIEW);
  }, [handleNavigate, handleClearPausedInterview]);
  
  const handleResumeInterview = useCallback(() => {
    if (pausedInterview) {
      setInterviewData(pausedInterview.interviewData);
      setChatHistory(pausedInterview.messages);
      setLanguage(pausedInterview.language);
      setFeedback('');
      handleNavigate(Screen.INTERVIEW);
    }
  }, [pausedInterview, handleNavigate]);

  const handlePauseInterview = useCallback(async (session: PausedInterview) => {
    setPausedInterview(session);
    if (user?.id) {
      await saveUserPausedSession(user.id, session);
    }
  }, [user]);

  // Dedicated handler to quit or exit the interview
  const handleQuitInterview = useCallback(async (discard: boolean) => {
    if (discard) {
      await handleClearPausedInterview();
      setInterviewData(null);
      setChatHistory([]);
      setFeedback('');
    } else {
      if (interviewData && user?.id) {
        const session: PausedInterview = {
          interviewData,
          messages: chatHistory,
          language,
        };
        await handlePauseInterview(session);
      }
    }
    handleNavigate(Screen.DASHBOARD);
  }, [handleClearPausedInterview, interviewData, chatHistory, language, user, handlePauseInterview, handleNavigate]);

  const handleShowFeedback = useCallback(async (feedbackText: string, history: ChatMessage[]) => {
    await handleClearPausedInterview();
    setFeedback(feedbackText);
    setChatHistory(history);

    if (user && user.id && interviewData) {
      const updatedCount = (user.interviewsCompleted || 0) + 1;
      await handleUpdateUser({ interviewsCompleted: updatedCount });
      
      // Save record to user's private Firestore interview collection
      try {
        await saveCompletedInterview(user.id, interviewData, feedbackText, history, language);
        const updatedHistory = await getUserInterviewHistory(user.id);
        setInterviewHistory(updatedHistory);
      } catch (e) {
        console.error("Failed to save interview to history:", e);
      }
    }
    handleNavigate(Screen.FEEDBACK);
  }, [handleClearPausedInterview, user, interviewData, language, handleUpdateUser, handleNavigate]);

  const handleViewPastInterview = useCallback((item: InterviewRecord) => {
    setFeedback(item.feedback);
    setChatHistory(item.messages || []);
    setInterviewData({
      companyName: item.companyName,
      jobRole: item.jobRole,
      companyUrl: item.companyUrl || '',
    });
    handleNavigate(Screen.FEEDBACK);
  }, [handleNavigate]);

  const handleRestart = useCallback(() => {
    setInterviewData(null);
    setChatHistory([]);
    setFeedback('');
    setTestQuestions([]);
    setTestResult(null);
    handleNavigate(Screen.DASHBOARD);
  }, [handleNavigate]);

  const handleStartTest = useCallback(async () => {
    if (!user) return;
    handleNavigate(Screen.TEST);
    try {
      const questions = await generateTest(user.progress);
      setTestQuestions(questions);
    } catch (e) {
      console.error("Failed to generate test", e);
      setError("Could not generate the promotion test. Please try again later.");
      handleNavigate(Screen.DASHBOARD);
    }
  }, [user, handleNavigate]);

  const handleFinishTest = useCallback(async (answers: UserAnswer[]) => {
    if (!user || testQuestions.length === 0) return;
    try {
      const result = await gradeTest(testQuestions, answers);
      setTestResult(result);
      if (result.passed) {
        const nextLevel = user.progress === 'Beginner' ? 'Intermediate' : 'Advanced';
        await handleUpdateUser({ progress: nextLevel, interviewsCompleted: 0 });
      }
      handleNavigate(Screen.TEST_RESULTS);
    } catch (e) {
      console.error("Failed to grade test", e);
      setError("Could not grade the test. Please try again later.");
      handleNavigate(Screen.DASHBOARD);
    }
  }, [testQuestions, user, handleUpdateUser, handleNavigate]);

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md fade-in border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Notice</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
            <button 
              onClick={handleRestart} 
              className="bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
      
    switch (screen) {
      case Screen.LANDING:
        return <LandingScreen onNavigate={handleNavigate} t={t} />;
      case Screen.LOGIN:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} t={t} />;
      case Screen.DASHBOARD:
        return (
          user && (
            <DashboardScreen 
              user={user} 
              onNavigate={handleNavigate} 
              onResume={handleResumeInterview} 
              onStartTest={handleStartTest} 
              hasPausedSession={!!pausedInterview}
              interviewHistory={interviewHistory}
              onViewPastInterview={handleViewPastInterview}
              t={t} 
            />
          )
        );
      case Screen.PLANS:
        return <PlansScreen user={user} onNavigate={handleNavigate} t={t} />;
      case Screen.PAYMENT:
        return <PaymentScreen onPaymentSuccess={handlePlanChange} onNavigate={handleNavigate} t={t} />;
      case Screen.SETUP:
        return <SetupForm onStart={handleStartInterview} t={t} />;
      case Screen.INTERVIEW:
        return (
          interviewData && user && (
            <InterviewScreen 
              user={user} 
              interviewData={interviewData} 
              initialMessages={chatHistory} 
              onShowFeedback={handleShowFeedback} 
              onPause={handlePauseInterview} 
              onQuit={handleQuitInterview}
              onNavigate={handleNavigate} 
              language={language} 
              t={t} 
            />
          )
        );
      case Screen.FEEDBACK:
        return user && <FeedbackScreen user={user} feedback={feedback} chatHistory={chatHistory} onRestart={handleRestart} onUpdateUser={handleUpdateUser} t={t} />;
      case Screen.PROFILE:
        return user && <ProfileScreen user={user} onUpdateUser={handleUpdateUser} onNavigate={handleNavigate} t={t} />;
      case Screen.RESOURCES:
        return <ResourcesScreen onNavigate={handleNavigate} t={t} />;
      case Screen.TEST:
        return <TestScreen questions={testQuestions} onSubmit={handleFinishTest} onCancel={handleRestart} t={t} />;
      case Screen.TEST_RESULTS:
        return user && testResult && <TestResultScreen questions={testQuestions} result={testResult} onContinue={handleRestart} nextLevel={user.progress} t={t} />;
      default:
        return <LandingScreen onNavigate={handleNavigate} t={t} />;
    }
  };
  
  const showHeader = isAuthenticated && ![Screen.INTERVIEW].includes(screen);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 flex flex-col transition-colors duration-300">
      {showHeader && user && (
        <Header 
          user={user} 
          language={language}
          theme={theme}
          onLanguageChange={setLanguage}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          onToggleTheme={toggleTheme}
          t={t}
        />
      )}
      <main className="w-full flex-grow flex items-center justify-center p-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;