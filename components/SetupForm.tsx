import React, { useState } from 'react';
import type { InterviewData } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface SetupFormProps {
  onStart: (data: InterviewData) => void;
  t: (key: string) => string;
}

const SetupForm: React.FC<SetupFormProps> = ({ onStart, t }) => {
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !jobRole || !companyUrl) return;
    setIsSubmitted(true);
    onStart({ companyName, jobRole, companyUrl });
  };

  if (isSubmitted) {
    return <LoadingSpinner message={t('interviewerPreparing')} />;
  }

  return (
    <div className="flex items-center justify-center fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">{t('interviewSimulationTitle')}</h2>
        <p className="text-center text-slate-500 mb-8">{t('interviewSimulationSubtitle')}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-600 mb-2">{t('companyNameLabel')}</label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t('companyNamePlaceholder')}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white dark:bg-slate-700"
              required
            />
          </div>
          <div>
            <label htmlFor="jobRole" className="block text-sm font-medium text-slate-600 mb-2">{t('jobRoleLabel')}</label>
            <input
              id="jobRole"
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder={t('jobRolePlaceholder')}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white dark:bg-slate-700"
              required
            />
          </div>
          <div>
            <label htmlFor="companyUrl" className="block text-sm font-medium text-slate-600 mb-2">{t('companyUrlLabel')}</label>
            <input
              id="companyUrl"
              type="url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder={t('companyUrlPlaceholder')}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white dark:bg-slate-700"
              required
            />
             <p className="text-xs text-slate-400 mt-2">{t('companyUrlNote')}</p>
          </div>
          <button
            type="submit"
            disabled={!companyName || !jobRole || !companyUrl}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {t('startInterviewButton')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupForm;
