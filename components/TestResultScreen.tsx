import React from 'react';
import { TestResult, User, TestQuestion } from '../types';
import { CheckCircleIcon, XCircleIcon } from './icons';

interface TestResultScreenProps {
  questions: TestQuestion[];
  result: TestResult;
  onContinue: () => void;
  nextLevel: User['progress'];
  t: (key: string) => string;
}

const TestResultScreen: React.FC<TestResultScreenProps> = ({ questions, result, onContinue, nextLevel, t }) => {
    const scoreColor = result.passed ? 'text-green-500' : 'text-amber-500';

    return (
        <div className="w-full max-w-3xl mx-auto fade-in">
            <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    {result.passed && <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />}
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('testResultTitle')}</h2>
                    
                    <div className="my-6">
                        <p className="text-lg text-slate-500 dark:text-slate-400">{t('yourScore')}</p>
                        <p className={`text-7xl font-bold ${scoreColor}`}>{result.score}%</p>
                    </div>
                    
                    {result.passed ? (
                        <p className="text-lg text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/10 py-3 px-4 rounded-lg">
                            {t('congratulations')} <strong>{nextLevel}</strong>!
                        </p>
                    ) : (
                        <p className="text-lg text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 py-3 px-4 rounded-lg">
                            {t('tryAgain')}
                        </p>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('overallFeedback')}</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{result.overallFeedback}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('detailedFeedbackTitle')}</h3>
                    <div className="space-y-6">
                        {result.detailedFeedback.map((fb, index) => {
                            const question = questions.find(q => q.id === fb.questionId);
                            if (!question) return null;

                            return (
                                <div key={fb.questionId} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start">
                                        {fb.isCorrect 
                                            ? <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-1" />
                                            : <XCircleIcon className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-1" />
                                        }
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{index + 1}. {question.question}</p>
                                            
                                            <div className={`p-2 rounded text-sm ${fb.isCorrect ? 'bg-green-100 dark:bg-green-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}>
                                                <span className="font-medium text-slate-500 dark:text-slate-400 mr-2">{t('yourAnswerLabel')}:</span>
                                                <span className="text-slate-800 dark:text-slate-100">{fb.userAnswer}</span>
                                            </div>

                                            {!fb.isCorrect && (
                                                <div className="mt-2 p-2 rounded text-sm bg-green-100 dark:bg-green-500/10">
                                                    <span className="font-medium text-slate-500 dark:text-slate-400 mr-2">{t('correctAnswerLabel')}:</span>
                                                    <span className="text-slate-800 dark:text-slate-100 font-semibold">{fb.correctAnswer}</span>
                                                </div>
                                            )}
                                            
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 border-t border-slate-200 dark:border-slate-600 pt-2">{fb.feedback}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                
                <div className="text-center mt-10">
                    <button
                        onClick={onContinue}
                        className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                    >
                        {t('backToDashboard')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestResultScreen;