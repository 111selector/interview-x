import React from 'react';
import { Screen } from '../types';
import { BotIcon } from './icons';

interface LandingScreenProps {
  onNavigate: (screen: Screen) => void;
  t: (key: string) => string;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate, t }) => {
  return (
    <div className="text-center w-full max-w-4xl mx-auto px-4 fade-in">
       <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <BotIcon className="w-12 h-12 text-white" />
       </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100 mb-4">
        {t('landingTitle')}
      </h1>
      <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-2">
        {t('landingSubtitle')}
      </p>
      <p className="text-lg md:text-xl font-semibold text-indigo-500 dark:text-indigo-400 max-w-2xl mx-auto mb-8">
        {t('landingSlogan')}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => onNavigate(Screen.SETUP)}
          className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-md"
        >
          {t('startInterviewButton')}
        </button>
        <button
          onClick={() => onNavigate(Screen.PLANS)}
          className="w-full sm:w-auto bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 dark:focus:ring-slate-500 transition border border-slate-300 dark:border-slate-600 shadow-md"
        >
          {t('explorePlansButton')}
        </button>
        <button
          onClick={() => onNavigate(Screen.LOGIN)}
          className="w-full sm:w-auto bg-transparent text-indigo-600 dark:text-indigo-400 font-bold py-3 px-8 rounded-lg hover:underline"
        >
          {t('loginButton')}
        </button>
      </div>
    </div>
  );
};

export default LandingScreen;