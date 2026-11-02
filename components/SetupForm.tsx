import React, { useState, useEffect } from 'react';
import type { InterviewData } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { validateSafeContent } from '../services/contentModeration';

interface SetupFormProps {
  onStart: (data: InterviewData) => void;
  t: (key: string) => string;
}

const SetupForm: React.FC<SetupFormProps> = ({ onStart, t }) => {
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('interviewSettings');
      if (savedSettings) {
        const settings: InterviewData = JSON.parse(savedSettings);
        setCompanyName(settings.companyName);
        setJobRole(settings.jobRole);
        setCompanyUrl(settings.companyUrl);
      }
    } catch (e) {
      console.error("Failed to parse saved interview settings.", e);
      localStorage.removeItem('interviewSettings');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!companyName.trim() || !jobRole.trim() || !companyUrl.trim()) return;

    // Content moderation check
    const checkCompany = validateSafeContent(companyName);
    if (!checkCompany.isClean) {
      setValidationError(checkCompany.message || 'Inappropriate or offensive text is not permitted.');
      return;
    }

    const checkRole = validateSafeContent(jobRole);
    if (!checkRole.isClean) {
      setValidationError(checkRole.message || 'Inappropriate or offensive text is not permitted.');
      return;
    }

    setIsSubmitted(true);
    onStart({ companyName: companyName.trim(), jobRole: jobRole.trim(), companyUrl: companyUrl.trim() });
  };

  if (isSubmitted) {
    return <LoadingSpinner message={t('interviewerPreparing')} />;
  }

  return (
    <div className="flex items-center justify-center fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
          {t('interviewSimulationTitle')}
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
          {t('interviewSimulationSubtitle')}
        </p>

        {validationError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('companyNameLabel')}
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                setValidationError('');
              }}
              placeholder={t('companyNamePlaceholder')}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label htmlFor="jobRole" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('jobRoleLabel')}
            </label>
            <input
              id="jobRole"
              type="text"
              value={jobRole}
              onChange={(e) => {
                setJobRole(e.target.value);
                setValidationError('');
              }}
              placeholder={t('jobRolePlaceholder')}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label htmlFor="companyUrl" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('companyUrlLabel')}
            </label>
            <input
              id="companyUrl"
              type="url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder={t('companyUrlPlaceholder')}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              required
            />
            <p className="text-xs text-slate-400 mt-2">{t('companyUrlNote')}</p>
          </div>
          <button
            type="submit"
            disabled={!companyName.trim() || !jobRole.trim() || !companyUrl.trim()}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {t('startInterviewButton')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupForm;