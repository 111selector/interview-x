import React from 'react';
import { Screen, User } from '../types';
import { CheckCircleIcon, BotIcon, EditIcon } from './icons';

interface DashboardScreenProps {
  user: User;
  onNavigate: (screen: Screen) => void;
  onResume: () => void;
  onStartTest: () => void;
  hasPausedSession: boolean;
  t: (key: string) => string;
}

const TrainingStep: React.FC<{ title: string; status: 'completed' | 'inprogress' | 'locked' }> = ({ title, status }) => {
    const statusClasses = {
        completed: { bg: 'bg-green-100 dark:bg-green-500/10', text: 'text-green-800 dark:text-green-300', icon: 'text-green-500 dark:text-green-400' },
        inprogress: { bg: 'bg-indigo-100 dark:bg-indigo-500/10', text: 'text-indigo-800 dark:text-indigo-300', icon: 'text-indigo-500 dark:text-indigo-400' },
        locked: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', icon: 'text-slate-400' },
    };
    return (
        <div className={`p-4 rounded-lg flex items-center ${statusClasses[status].bg}`}>
            <div className={`w-6 h-6 mr-3 flex-shrink-0 ${statusClasses[status].icon}`}>
                <CheckCircleIcon className="w-6 h-6" />
            </div>
            <span className={`font-semibold ${statusClasses[status].text}`}>{title}</span>
        </div>
    );
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onNavigate, onResume, onStartTest, hasPausedSession, t }) => {
  const interviewsForNextLevel = 3;
  const canTakeTest = user.progress !== 'Advanced' && (user.interviewsCompleted || 0) >= interviewsForNextLevel;
  const nextLevel = user.progress === 'Beginner' ? 'Intermediate' : 'Advanced';

  return (
    <div className="w-full max-w-4xl mx-auto fade-in">
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('welcomeBack')}, {user.name}!</h1>
        <button 
          onClick={() => onNavigate(Screen.PROFILE)}
          className="flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition border border-slate-300 dark:border-slate-600 shadow-sm"
        >
          <EditIcon className="w-4 h-4" />
          {t('editProfileButton')}
        </button>
      </div>

      {canTakeTest && (
        <div className="mb-6 bg-amber-100 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 p-4 rounded-r-lg" role="alert">
          <div className="flex">
            <div className="py-1"><svg className="fill-current h-6 w-6 text-amber-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM11 15v-2h-2v2h2zm0-4V5h-2v6h2z"/></svg></div>
            <div className="flex-1">
              <p className="font-bold">Ready for the Next Level?</p>
              <p className="text-sm">You've completed {user.interviewsCompleted} interviews. Pass a short test to unlock the <strong>{nextLevel}</strong> training level!</p>
              <button onClick={onStartTest} className="mt-2 bg-amber-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 transition">
                {t('takePromotionTest')}
              </button>
            </div>
          </div>
        </div>
       )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Action Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BotIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Ready for your next challenge?</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Start a new simulated interview or continue where you left off.</p>
            <div className="flex flex-col sm:flex-row gap-4">
                 {hasPausedSession && (
                    <button
                        onClick={onResume}
                        className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                    >
                        {t('resumeInterview')}
                    </button>
                 )}
                 <button
                    onClick={() => onNavigate(Screen.SETUP)}
                    className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                    >
                    {t('startInterviewButton')}
                </button>
            </div>
        </div>

        {/* Side Cards */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">{t('yourProgress')}</h3>
                <div className="space-y-3">
                    <TrainingStep title="Beginner" status={user.progress === 'Beginner' ? 'inprogress' : 'completed'} />
                    <TrainingStep title="Intermediate" status={user.progress === 'Intermediate' ? 'inprogress' : (user.progress === 'Advanced' ? 'completed' : 'locked')} />
                    <TrainingStep title="Advanced" status={user.progress === 'Advanced' ? 'inprogress' : 'locked'} />
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">{t('currentPlan')}</h3>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{user.plan}</p>
                 <button
                    onClick={() => onNavigate(Screen.PLANS)}
                    className="mt-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    {t('upgradePlan')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;