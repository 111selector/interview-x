import React, { useState, useCallback, useEffect } from 'react';
import { Screen, Plan, User, InterviewData, ChatMessage, Theme, PausedInterview, TestQuestion, TestResult, UserAnswer } from './types';
import { languages, translations } from './i18n';
import { generateTest, gradeTest } from './services/geminiService';

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

  // State for new features
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [testResult, setTestResult] = useState<TestResult | null>(null);


  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  useEffect(() => {
    try {
        const savedSession = localStorage.getItem('pausedInterview');
        if (savedSession) {
            setPausedInterview(JSON.parse(savedSession));
        }
    } catch (e) {
        console.error("Failed to parse paused interview session.", e);
        localStorage.removeItem('pausedInterview');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  }, []);

  const t = useCallback((key: keyof typeof translations) => {
    const translationSet = translations as any;
    return translationSet[key]?.[language] || translations[key]['en'];
  }, [language]);

  const handleNavigate = useCallback((newScreen: Screen, data?: any) => {
    const screensRequiringApiKey = [Screen.SETUP, Screen.INTERVIEW, Screen.TEST, Screen.RESOURCES];
    if (!process.env.API_KEY && screensRequiringApiKey.includes(newScreen)) {
      setError('API_KEY environment variable not set. Please configure it to use the application.');
      return;
    }

    const authRequired = ![Screen.LANDING, Screen.LOGIN, Screen.PLANS].includes(newScreen);
    if (authRequired && !isAuthenticated) {
      setScreen(Screen.LOGIN);
      return;
    }
    
    setError('');
    setScreen(newScreen);
  }, [isAuthenticated]);
  
  const handleClearPausedInterview = useCallback(() => {
      localStorage.removeItem('pausedInterview');
      setPausedInterview(null);
  }, []);

  const handleLogin = useCallback(() => {
    const mockUser: User = { 
        name: 'Alex', 
        email: 'alex.doe@example.com',
        plan: Plan.PRO, 
        progress: 'Beginner',
        interviewsCompleted: 2,
        downloadsUsed: 1,
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    setScreen(Screen.DASHBOARD);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setScreen(Screen.LANDING);
  }, []);
  
  const handleUpdateUser = useCallback((updatedUserData: Partial<User>) => {
    if (user) {
        const newUser = { ...user, ...updatedUserData };
        setUser(newUser);
    }
  }, [user]);

  const handlePlanChange = useCallback((newPlan: Plan) => {
    if (user) {
      setUser({ ...user, plan: newPlan, downloadsUsed: 0 }); // Reset downloads on plan change
      handleNavigate(Screen.DASHBOARD);
    }
  }, [user, handleNavigate]);

  const handleStartInterview = useCallback((data: InterviewData) => {
    localStorage.setItem('interviewSettings', JSON.stringify(data));
    handleClearPausedInterview();
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

  const handleShowFeedback = useCallback((feedbackText: string, history: ChatMessage[]) => {
    handleClearPausedInterview();
    setFeedback(feedbackText);
    setChatHistory(history);
    if(user) {
        handleUpdateUser({ interviewsCompleted: (user.interviewsCompleted || 0) + 1 });
    }
    handleNavigate(Screen.FEEDBACK);
  }, [handleNavigate, handleClearPausedInterview, user, handleUpdateUser]);

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
    handleNavigate(Screen.TEST); // Show loading screen immediately
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
            handleUpdateUser({ progress: nextLevel, interviewsCompleted: 0 });
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
                <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl max-w-md fade-in">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h2>
                    <p className="text-slate-600 dark:text-slate-300">{error}</p>
                     <button onClick={handleRestart} className="mt-6 bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700">Go to Dashboard</button>
                </div>
            </div>
        );
    }
      
    switch (screen) {
      case Screen.LANDING:
        return <LandingScreen onNavigate={handleNavigate} t={t} />;
      case Screen.LOGIN:
        return <LoginScreen onLogin={handleLogin} onNavigate={handleNavigate} t={t}/>;
      case Screen.DASHBOARD:
        return user && <DashboardScreen user={user} onNavigate={handleNavigate} onResume={handleResumeInterview} onStartTest={handleStartTest} hasPausedSession={!!pausedInterview} t={t} />;
      case Screen.PLANS:
        return <PlansScreen user={user} onNavigate={handleNavigate} t={t} />;
      case Screen.PAYMENT:
        return <PaymentScreen onPaymentSuccess={handlePlanChange} onNavigate={handleNavigate} t={t} />;
      case Screen.SETUP:
        return <SetupForm onStart={handleStartInterview} t={t} />;
      case Screen.INTERVIEW:
        return interviewData && user && <InterviewScreen user={user} interviewData={interviewData} initialMessages={chatHistory} onShowFeedback={handleShowFeedback} onPause={setPausedInterview} onNavigate={handleNavigate} language={language} t={t} />;
      case Screen.FEEDBACK:
        return user && <FeedbackScreen user={user} feedback={feedback} chatHistory={chatHistory} onRestart={handleRestart} onUpdateUser={handleUpdateUser} t={t} />;
      case Screen.PROFILE:
        return user && <ProfileScreen user={user} onUpdateUser={handleUpdateUser} onNavigate={handleNavigate} t={t} />;
      case Screen.RESOURCES:
        return <ResourcesScreen onNavigate={handleNavigate} t={t} />;
      case Screen.TEST:
        return <TestScreen questions={testQuestions} onSubmit={handleFinishTest} onCancel={handleRestart} t={t} />;
      case Screen.TEST_RESULTS:
        return user && testResult && <TestResultScreen result={testResult} onContinue={handleRestart} nextLevel={user.progress} t={t} />;
      default:
        return <LandingScreen onNavigate={handleNavigate} t={t} />;
    }
  };
  
  const showHeader = isAuthenticated && ![Screen.INTERVIEW].includes(screen);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 flex flex-col">
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