import React, { useState, useRef, useEffect } from 'react';
import { Screen, User, Theme } from '../types';
import { BotIcon, UserIcon, LanguageIcon, ChevronDownIcon, SunIcon, MoonIcon } from './icons';
import { languages } from '../i18n';

interface HeaderProps {
  user: User;
  language: string;
  theme: Theme;
  onLanguageChange: (lang: string) => void;
  onLogout: () => void;
  onNavigate: (screen: Screen) => void;
  onToggleTheme: () => void;
  t: (key: string) => string;
}

const ThemeToggleButton: React.FC<{theme: Theme, onToggle: () => void}> = ({ theme, onToggle }) => {
    return (
        <button onClick={onToggle} className="flex items-center justify-center w-10 h-10 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
            {theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6"/>}
        </button>
    )
}

const Header: React.FC<HeaderProps> = ({ user, language, theme, onLanguageChange, onLogout, onNavigate, onToggleTheme, t }) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (langRef.current && !langRef.current.contains(event.target as Node)) {
      setLangDropdownOpen(false);
    }
    if (userRef.current && !userRef.current.contains(event.target as Node)) {
      setUserDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedLanguageName = languages.find(l => l.code === language)?.name || 'Language';

  return (
    <header className="w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate(Screen.DASHBOARD)}>
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center mr-2">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">InterviewX</h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <nav className="hidden md:flex space-x-4">
               <button onClick={() => onNavigate(Screen.DASHBOARD)} className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">{t('dashboard')}</button>
               <button onClick={() => onNavigate(Screen.PLANS)} className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">{t('plans')}</button>
            </nav>

            {/* Language Selector */}
            <div className="relative" ref={langRef}>
              <button onClick={() => setLangDropdownOpen(!langDropdownOpen)} className="flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                <LanguageIcon className="w-5 h-5 mr-2"/>
                <span>{selectedLanguageName.split(' ')[0]}</span>
                <ChevronDownIcon className="w-5 h-5 ml-1" />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg py-1 z-20 border border-slate-200 dark:border-slate-600">
                  {languages.map(lang => (
                    <a
                      key={lang.code}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onLanguageChange(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                      {lang.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
            
            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />

            {/* User Menu */}
            <div className="relative" ref={userRef}>
              <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center justify-center w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-full text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 overflow-hidden">
                {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <UserIcon className="w-6 h-6"/>
                )}
              </button>
              {userDropdownOpen && (
                 <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-700 rounded-md shadow-lg py-1 z-20 border border-slate-200 dark:border-slate-600">
                   <div className="px-4 py-2 border-b dark:border-slate-600">
                     <p className="text-sm text-slate-800 dark:text-slate-100 font-semibold truncate">{user.name}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                   </div>
                   <button
                     onClick={() => { onNavigate(Screen.PROFILE); setUserDropdownOpen(false); }}
                     className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                   >
                     {t('profile')}
                   </button>
                   <button
                     onClick={() => { onLogout(); setUserDropdownOpen(false); }}
                     className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                   >
                     {t('logout')}
                   </button>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;