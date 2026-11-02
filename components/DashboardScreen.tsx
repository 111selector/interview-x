import React, { useState } from 'react';
import { Screen, User, InterviewRecord } from '../types';
import { CheckCircleIcon, BotIcon, EditIcon, BookOpenIcon, HistoryIcon } from './icons';

interface DashboardScreenProps {
  user: User;
  onNavigate: (screen: Screen) => void;
  onResume: () => void;
  onStartTest: () => void;
  hasPausedSession: boolean;
  interviewHistory?: InterviewRecord[];
  onViewPastInterview?: (interview: InterviewRecord) => void;
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
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  user, 
  onNavigate, 
  onResume, 
  onStartTest, 
  hasPausedSession, 
  interviewHistory = [],
  onViewPastInterview,
  t 
}) => {
  const [selectedPastSession, setSelectedPastSession] = useState<InterviewRecord | null>(null);
  const interviewsForNextLevel = 3;
  const canTakeTest = user.progress !== 'Advanced' && (user.interviewsCompleted || 0) >= interviewsForNextLevel;
  const nextLevel = user.progress === 'Beginner' ? 'Intermediate' : 'Advanced';

  return (
    <div className="w-full max-w-4xl mx-auto fade-in pb-12">
      {/* Welcome Bar */}
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {t('welcomeBack')}, {user.name}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Logged in via {user.provider || 'Google'} ({user.email})</span>
          </p>
        </div>

        <button 
          onClick={() => onNavigate(Screen.PROFILE)}
          className="flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition border border-slate-300 dark:border-slate-600 shadow-sm"
        >
          <EditIcon className="w-4 h-4" />
          {t('editProfileButton')}
        </button>
      </div>

      {canTakeTest && (
        <div className="mb-6 bg-amber-100 dark:bg-amber-500/10 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 p-4 rounded-r-lg" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-amber-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM11 15v-2h-2v2h2zm0-4V5h-2v6h2z"/>
              </svg>
            </div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Main Action Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BotIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Ready for your next challenge?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            Start a new simulated interview with AI feedback, or continue where you left off.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {hasPausedSession && (
              <button
                onClick={onResume}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition shadow-md"
              >
                {t('resumeInterview')}
              </button>
            )}
            <button
              onClick={() => onNavigate(Screen.SETUP)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-md"
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
            <div className="flex items-center mb-3">
              <BookOpenIcon className="w-6 h-6 mr-3 text-indigo-500 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('careerResources')}</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('careerResourcesSubtitle')}</p>
            <button
              onClick={() => onNavigate(Screen.RESOURCES)}
              className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              {t('viewArticles')}
            </button>
          </div>
        </div>
      </div>

      {/* User's Private Interview History Section */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <HistoryIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Your Private Interview History
            </h3>
          </div>
          <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
            🔒 Strictly Private to {user.email}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Every interview you complete is saved directly in your personal cloud repository. Other accounts cannot view your transcripts or coach reviews.
        </p>

        {interviewHistory.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">No completed interviews yet.</p>
            <p className="text-xs text-slate-400 mb-4">Complete an interview session and ask for feedback to save it to your history.</p>
            <button
              onClick={() => onNavigate(Screen.SETUP)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Start Your First Interview →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {interviewHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between flex-wrap gap-3 transition"
              >
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    {item.jobRole}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.companyName} • {new Date(item.completedAt || item.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {item.messages?.length || 0} messages
                  </span>
                  <button
                    onClick={() => {
                      if (onViewPastInterview) {
                        onViewPastInterview(item);
                      } else {
                        setSelectedPastSession(item);
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg text-xs font-semibold transition border border-indigo-200 dark:border-indigo-800"
                  >
                    View Report & Transcript
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for viewing past interview history item if clicked */}
      {selectedPastSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {selectedPastSession.jobRole} — {selectedPastSession.companyName}
                </h3>
                <p className="text-xs text-slate-400">
                  Completed {new Date(selectedPastSession.completedAt || selectedPastSession.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedPastSession(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">AI Feedback & Assessment</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl whitespace-pre-wrap text-slate-600 dark:text-slate-300 text-xs sm:text-sm border border-slate-200 dark:border-slate-700">
                  {selectedPastSession.feedback}
                </div>
              </div>

              {selectedPastSession.messages && selectedPastSession.messages.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Transcript Summary ({selectedPastSession.messages.length} messages)</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    {selectedPastSession.messages.map((m, idx) => (
                      <div key={idx} className="text-xs">
                        <span className={`font-semibold ${m.sender === 'ai' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {m.sender === 'ai' ? 'Alex (Interviewer): ' : 'You: '}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">{m.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedPastSession(null)}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;