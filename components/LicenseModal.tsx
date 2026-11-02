import React from 'react';

interface LicenseModalProps {
    onAccept: () => void;
    onCancel: () => void;
    t: (key: string) => string;
}

const LicenseModal: React.FC<LicenseModalProps> = ({ onAccept, onCancel, t }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 fade-in" aria-modal="true" role="dialog">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-lg w-full border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">{t('licenseAgreement')}</h2>
            <div className="max-h-60 overflow-y-auto pr-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">{t('licenseText')}</p>
            </div>
            <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-slate-200 dark:border-slate-600">
                <button 
                    onClick={onCancel} 
                    className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                    Cancel
                </button>
                <button 
                    onClick={onAccept} 
                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
                >
                    {t('acceptAndDownload')}
                </button>
            </div>
        </div>
    </div>
);

export default LicenseModal;