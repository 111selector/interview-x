import React, { useState } from 'react';
import { TestQuestion, UserAnswer } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface TestScreenProps {
  questions: TestQuestion[];
  onSubmit: (answers: UserAnswer[]) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

const TestScreen: React.FC<TestScreenProps> = ({ questions, onSubmit, onCancel, t }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelect = (questionId: string, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formattedAnswers: UserAnswer[] = Object.keys(answers).map(qId => ({ questionId: qId, answer: answers[qId] }));
        onSubmit(formattedAnswers);
    };

    if (isSubmitting) {
        return <LoadingSpinner message={t('gradingAnswers')} />;
    }
    
    if (!questions || questions.length === 0) {
        return <LoadingSpinner message={t('generatingTest')} />;
    }

    const allQuestionsAnswered = questions.length === Object.keys(answers).length;

    return (
        <div className="w-full max-w-2xl mx-auto fade-in">
            <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('promotionTestTitle')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">{t('promotionTestSubtitle')}</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-8">
                        {questions.map((q, index) => (
                            <div key={q.id}>
                                <p className="font-semibold text-lg text-slate-700 dark:text-slate-200 mb-4">{index + 1}. {q.question}</p>
                                <div className="space-y-3">
                                    {q.options.map(option => (
                                        <label key={option} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${answers[q.id] === option ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'}`}>
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={option}
                                                checked={answers[q.id] === option}
                                                onChange={() => handleSelect(q.id, option)}
                                                className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                            />
                                            <span className="ml-3 text-slate-700 dark:text-slate-300">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4 border-t border-slate-200 dark:border-slate-700 pt-6 mt-10">
                        <button type="button" onClick={onCancel} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={!allQuestionsAnswered}
                            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {t('submitAnswers')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TestScreen;