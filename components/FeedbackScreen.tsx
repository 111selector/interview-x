import React, { useState } from 'react';
import { User, Plan, ChatMessage } from '../types';
import { CheckCircleIcon, DownloadIcon } from './icons';
import LicenseModal from './LicenseModal';

interface FeedbackScreenProps {
  user: User;
  feedback: string;
  chatHistory: ChatMessage[];
  onRestart: () => void;
  onUpdateUser: (userData: Partial<User>) => void;
  t: (key: string) => string;
}

const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ user, feedback, chatHistory, onRestart, onUpdateUser, t }) => {
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [downloadType, setDownloadType] = useState<'pdf'|'json'|null>(null);

  const getPlanLimits = (plan: Plan) => {
    switch(plan) {
        case Plan.PREMIUM: return { downloads: 20, pdf: true, json: true, license: true };
        case Plan.PRO: return { downloads: 6, pdf: true, json: true, license: false };
        case Plan.STANDARD: return { downloads: 2, pdf: true, json: false, license: false };
        default: return { downloads: 0, pdf: false, json: false, license: false };
    }
  }

  const planLimits = getPlanLimits(user.plan);
  const downloadsLeft = planLimits.downloads - (user.downloadsUsed || 0);

  const formatFeedback = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-6 mb-3">{line.replace('### ', '')}</h3>;
        }
        if (line.trim() === '') {
            return null; // Don't render empty lines as <br>
        }
        return <p key={index} className="text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{line}</p>;
      })
      .filter(Boolean); // Remove null entries
  };

  const executeDownload = (type: 'pdf' | 'json') => {
    if (type === 'json') {
      const dataStr = JSON.stringify({ feedback, chatHistory }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `InterviewX_Report_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else { // PDF
      const reportHtml = `
        <html>
          <head><title>Interview Feedback Report</title>
          <style>body{font-family:sans-serif;line-height:1.6;} h3{margin-top:2em;border-bottom:1px solid #ccc;padding-bottom:0.5em;} pre{white-space:pre-wrap;background-color:#f4f4f4;padding:1em;border-radius:8px;}</style>
          </head>
          <body><h1>Interview Feedback Report</h1>${feedback.replace(/### (.*)/g, '<h3>$1</h3>').replace(/\n/g, '<br/>')}
          <hr/><h2>Full Transcript</h2><pre>${JSON.stringify(chatHistory, null, 2)}</pre></body>
        </html>`;
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `InterviewX_Report_${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
      // A slightly better way than window.print for saving
      alert("Report saved as an HTML file, which you can open and print to PDF.");
    }
    onUpdateUser({ downloadsUsed: (user.downloadsUsed || 0) + 1 });
    setShowLicenseModal(false);
  }

  const handleDownloadClick = (type: 'pdf'|'json') => {
      if (downloadsLeft <= 0) return;
      setDownloadType(type);
      if (planLimits.license) {
        setShowLicenseModal(true);
      } else {
        executeDownload(type);
      }
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 fade-in">
      <div className="text-center mb-8">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('feedbackReportTitle')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t('feedbackReportSubtitle')}</p>
      </div>
      
      <div className="prose dark:prose-invert max-w-none">
        {formatFeedback(feedback)}
      </div>
      
      <div className="mt-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">{t('downloadAs')}</h4>
        {planLimits.downloads > 0 ? (
          <div className="flex flex-wrap items-center gap-4">
            {planLimits.pdf && (
              <button onClick={() => handleDownloadClick('pdf')} disabled={downloadsLeft <= 0} className="flex items-center gap-2 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition disabled:bg-slate-400 disabled:cursor-not-allowed">
                <DownloadIcon className="w-5 h-5" /> {t('downloadPDF')}
              </button>
            )}
            {planLimits.json && (
              <button onClick={() => handleDownloadClick('json')} disabled={downloadsLeft <= 0} className="flex items-center gap-2 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition disabled:bg-slate-400 disabled:cursor-not-allowed">
                <DownloadIcon className="w-5 h-5" /> {t('downloadJSON')}
              </button>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">{downloadsLeft} {t('downloadsRemaining')}</p>
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-300">{t('upgradeForDownloads')}</p>
        )}
      </div>

      <div className="text-center mt-12">
        <button
          onClick={onRestart}
          className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
        >
          {t('newInterviewButton')}
        </button>
      </div>
      {showLicenseModal && downloadType && <LicenseModal onAccept={() => executeDownload(downloadType)} onCancel={() => setShowLicenseModal(false)} t={t} />}
    </div>
  );
};

export default FeedbackScreen;