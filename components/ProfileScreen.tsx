import React, { useState, useRef } from 'react';
import { Screen, User } from '../types';
import { BotIcon, EditIcon } from './icons';

interface ProfileScreenProps {
  user: User;
  onUpdateUser: (userData: Partial<User>) => void;
  onNavigate: (screen: Screen) => void;
  t: (key: string) => string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onUpdateUser, onNavigate, t }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(user.profilePicture);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_SIZE_MB = 2;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

      if (file.size > MAX_SIZE_BYTES) {
        alert(`File is too large. Please select an image under ${MAX_SIZE_MB}MB.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData: Partial<User> = {};
    if (name !== user.name) updatedData.name = name;
    if (email !== user.email) updatedData.email = email;
    if (profilePicture !== user.profilePicture) updatedData.profilePicture = profilePicture;
    
    if (Object.keys(updatedData).length > 0) {
        onUpdateUser(updatedData);
    }
    
    onNavigate(Screen.DASHBOARD);
  };

  return (
    <div className="w-full max-w-3xl mx-auto fade-in">
      <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('profileTitle')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">{t('profileSubtitle')}</p>
        
        <form onSubmit={handleSaveChanges}>
          {/* Profile Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <BotIcon className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePictureChange} accept="image/*" className="hidden" aria-label={t('profilePictureLabel')} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-white dark:bg-slate-600 p-1.5 rounded-full shadow-md border border-slate-300 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-500" aria-label={t('changePictureButton')}>
                  <EditIcon className="w-4 h-4 text-slate-600 dark:text-slate-200" />
                </button>
              </div>
              <div className="flex-1 w-full">
                <label htmlFor="username" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('usernameLabel')}</label>
                <input
                  id="username"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>
          
          {/* Account Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 pt-6 mb-4">{t('emailLabel')}</h3>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('emailLabel')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          {/* Security Section */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 pt-6 mb-4">{t('securityTitle')}</h3>
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col">
                    <span className="text-slate-600 dark:text-slate-300">Password</span>
                    <span className="text-xs text-slate-400">••••••••••••</span>
                </div>
                <button type="button" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    {t('changePasswordButton')}
                </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <button type="button" onClick={() => onNavigate(Screen.DASHBOARD)} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700">
                Cancel
            </button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition">
                {t('saveChangesButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileScreen;