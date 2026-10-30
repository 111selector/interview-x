import React, { useState } from 'react';
import { Screen, User } from '../types';
import { GoogleIcon, MicrosoftIcon, InstagramIcon, TikTokIcon, BotIcon } from './icons';
import { 
  signInWithGoogle, 
  signInWithMicrosoft, 
  signInWithInstagram, 
  signInWithTikTok, 
  getOrCreateUserProfile 
} from '../services/firebase';
import LoadingSpinner from './LoadingSpinner';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (screen: Screen) => void;
  t: (key: string) => string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onNavigate, t }) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');

  const handleProviderSignIn = async (providerName: string) => {
    setLoadingProvider(providerName);
    setErrorMessage('');
    setInfoMessage('');

    try {
      let fbUser;
      if (providerName === 'Google') {
        fbUser = await signInWithGoogle();
      } else if (providerName === 'Microsoft') {
        fbUser = await signInWithMicrosoft();
      } else if (providerName === 'Instagram') {
        fbUser = await signInWithInstagram();
      } else if (providerName === 'TikTok') {
        fbUser = await signInWithTikTok();
      }

      if (fbUser) {
        const appUser = await getOrCreateUserProfile(fbUser);
        onLoginSuccess(appUser);
      }
    } catch (error: any) {
      const code = error?.code || '';
      const message = error?.message || '';

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        console.info(`[Auth] User closed the sign-in popup for ${providerName}.`);
        setErrorMessage('Sign-in window was closed before finishing. Click below to try again.');
      } else if (code === 'auth/popup-blocked') {
        console.warn(`[Auth] Sign-in popup was blocked by the browser for ${providerName}.`);
        setErrorMessage('The sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found' || code === 'auth/invalid-provider-id') {
        console.warn(`[Auth] Provider ${providerName} is not yet enabled in the Firebase Console:`, code);
        setErrorMessage(
          `${providerName} sign-in needs to be activated in your Firebase project console.`
        );
        setInfoMessage(
          `To activate ${providerName}: In Firebase Console > Authentication > Sign-in method, enable ${providerName}. In the meantime, you can sign in with your Google or Microsoft account!`
        );
      } else if (code === 'auth/network-request-failed') {
        console.warn(`[Auth] Network issue during ${providerName} sign-in.`);
        setErrorMessage('Network connection error. Please check your internet connection.');
      } else {
        console.warn(`[Auth] Notice during ${providerName} sign-in:`, message);
        setErrorMessage(message || `Unable to complete sign-in with ${providerName}. Please try again.`);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 fade-in">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
          <BotIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">
          {t('loginTitle') || 'Log in to InterviewX'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
          Sign in securely with your verified social account.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-200 flex items-start justify-between">
          <div className="flex-1 pr-2">
            <p className="font-medium">{errorMessage}</p>
            {infoMessage && <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">{infoMessage}</p>}
          </div>
          <button 
            type="button" 
            onClick={() => { setErrorMessage(''); setInfoMessage(''); }}
            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 font-bold text-base leading-none p-1"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Social Login Options - strictly Google, Microsoft, Instagram, TikTok */}
      <div className="space-y-3">
        {/* Google Sign In */}
        <button
          type="button"
          onClick={() => handleProviderSignIn('Google')}
          disabled={loadingProvider !== null}
          className="w-full flex items-center justify-center py-3.5 px-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-100 font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          {loadingProvider === 'Google' ? (
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Connecting Google...</span>
            </div>
          ) : (
            <>
              <GoogleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Log In With Google</span>
            </>
          )}
        </button>

        {/* Microsoft Sign In */}
        <button
          type="button"
          onClick={() => handleProviderSignIn('Microsoft')}
          disabled={loadingProvider !== null}
          className="w-full flex items-center justify-center py-3.5 px-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-100 font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingProvider === 'Microsoft' ? (
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Connecting Microsoft...</span>
            </div>
          ) : (
            <>
              <MicrosoftIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Log In With Microsoft</span>
            </>
          )}
        </button>

        {/* Instagram Sign In */}
        <button
          type="button"
          onClick={() => handleProviderSignIn('Instagram')}
          disabled={loadingProvider !== null}
          className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-amber-500/20 border border-pink-300 dark:border-pink-800/60 rounded-xl text-slate-800 dark:text-slate-100 font-semibold transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingProvider === 'Instagram' ? (
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Connecting Instagram...</span>
            </div>
          ) : (
            <>
              <InstagramIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Log In With Instagram</span>
            </>
          )}
        </button>

        {/* Real TikTok Sign In */}
        <button
          type="button"
          onClick={() => handleProviderSignIn('TikTok')}
          disabled={loadingProvider !== null}
          className="w-full flex items-center justify-center py-3.5 px-4 bg-black hover:bg-neutral-900 border border-black dark:border-neutral-700 rounded-xl text-white font-semibold transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingProvider === 'TikTok' ? (
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
              <span>Connecting TikTok...</span>
            </div>
          ) : (
            <>
              <TikTokIcon className="w-5 h-5 mr-3 flex-shrink-0 text-white" />
              <span>Log In With TikTok</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Connected to Firebase Authentication. Each account's data and interview history is strictly private and isolated.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;