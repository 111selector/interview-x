import React from 'react';
import { Screen } from '../types';
import { 
    GoogleIcon, MicrosoftIcon, AppleIcon, FacebookIcon, 
    InstagramIcon, TikTokIcon, BotIcon
} from './icons';

interface LoginScreenProps {
  onLogin: () => void;
  onNavigate: (screen: Screen) => void;
  t: (key: string) => string;
}

const socialLogins = [
    { name: 'Google', icon: GoogleIcon },
    { name: 'Microsoft', icon: MicrosoftIcon },
    { name: 'Apple', icon: AppleIcon },
    { name: 'Facebook', icon: FacebookIcon },
    { name: 'Instagram', icon: InstagramIcon },
    { name: 'TikTok', icon: TikTokIcon },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigate, t }) => {
  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BotIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">{t('loginTitle')}</h2>
        </div>
        
        <div className="space-y-3">
            {socialLogins.map(provider => (
                <button
                    key={provider.name}
                    onClick={onLogin} // Simulates login for any provider
                    className="w-full flex items-center justify-center py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                    <provider.icon className="w-6 h-6 mr-3" />
                    <span>{t('loginWith')} {provider.name}</span>
                </button>
            ))}
        </div>

        <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    </div>
  );
};

export default LoginScreen;