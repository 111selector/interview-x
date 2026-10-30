import React, { useState } from 'react';
import { Article, Screen } from '../types';
import { generateArticle, generateArticleImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { ArrowLeftIcon } from './icons';

const topics = [
    "How to answer 'Tell me about yourself'",
    "Explaining the STAR method for behavioral questions",
    "Top 5 body language tips for interviews",
    "How to research a company before an interview",
    "Questions to ask the interviewer",
    "Following up after an interview",
    "Negotiating your salary",
    "Dressing for success in a modern workplace",
];

interface ResourcesScreenProps {
  onNavigate: (screen: Screen) => void;
  t: (key: string) => string;
}

const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
        if (line.startsWith('## ')) {
            return <h2 key={index} className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-3">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('* ')) {
            return <li key={index} className="ml-5 list-disc text-slate-600 dark:text-slate-300 leading-relaxed">{line.replace('* ', '')}</li>;
        }
        if (line.match(/^\d+\.\s/)) {
            return <li key={index} className="ml-5 list-decimal text-slate-600 dark:text-slate-300 leading-relaxed">{line.replace(/^\d+\.\s/, '')}</li>;
        }
        if (line.trim() === '') {
            return <br key={index} />;
        }
        return <p key={index} className="text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{line}</p>;
    });
};


const ResourcesScreen: React.FC<ResourcesScreenProps> = ({ onNavigate, t }) => {
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSelectTopic = async (topic: string) => {
        setIsLoading(true);
        setError('');
        setSelectedArticle(null);
        try {
            const [content, imageUrl] = await Promise.all([
                generateArticle(topic),
                generateArticleImage(topic),
            ]);
            setSelectedArticle({ title: topic, content, imageUrl });
        } catch (err) {
            console.error("Failed to generate article:", err);
            setError("Sorry, we couldn't generate the article. Please try another topic.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setSelectedArticle(null);
        setError('');
    };

    if (isLoading) {
        return <LoadingSpinner message={t('generatingArticle')} />;
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <p className="text-red-500">{error}</p>
                <button onClick={handleBack} className="mt-4 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">
                    {t('backToTopics')}
                </button>
            </div>
        );
    }

    if (selectedArticle) {
        return (
            <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 fade-in">
                <button onClick={handleBack} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-6">
                    <ArrowLeftIcon className="w-4 h-4" />
                    {t('backToTopics')}
                </button>
                <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-64 object-cover rounded-lg mb-6" />
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-4">{selectedArticle.title}</h1>
                <div className="prose dark:prose-invert max-w-none">
                    {formatContent(selectedArticle.content)}
                </div>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-4xl mx-auto text-center fade-in">
            <h2 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-3">{t('browseTopics')}</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-12">{t('browseTopicsSubtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topics.map(topic => (
                    <button
                        key={topic}
                        onClick={() => handleSelectTopic(topic)}
                        className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-indigo-100 dark:hover:shadow-indigo-900/50 text-left transition"
                    >
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{topic}</h3>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ResourcesScreen;