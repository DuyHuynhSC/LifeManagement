import React, { useState } from 'react';
import { Bell, Moon, Sun, Shield, ChevronDown, Check, Crown } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface HeaderProps {
  onOpenAlerts?: () => void;
  urgentAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAlerts, urgentAlertsCount }) => {
  const { users, currentUser, setCurrentUser, settings, setTheme, setLanguage } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* User Switcher */}
      <div className="relative">
        <button
          onClick={() => {
            setShowUserMenu(!showUserMenu);
            setShowLangMenu(false);
          }}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <span className="text-xl leading-none">{currentUser.avatar}</span>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight truncate max-w-[90px] xs:max-w-[120px] flex items-center gap-1">
              <span>{currentUser.name}</span>
              {currentUser.role === 'admin' && <Crown size={11} className="text-amber-500 shrink-0" />}
            </div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium capitalize">
              {currentUser.role === 'admin' ? 'Admin' : currentUser.role}
            </div>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {/* User dropdown */}
        {showUserMenu && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 px-3 py-1.5 uppercase tracking-wider">
              {t('action_switch_user')}
            </div>
            <div className="space-y-1">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u.id);
                    setShowUserMenu(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                    u.id === currentUser.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{u.avatar}</span>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span>{u.name}</span>
                        {u.role === 'admin' && <Crown size={11} className="text-amber-500" />}
                      </div>
                      <div className="text-[10px] opacity-80 capitalize flex items-center gap-1">
                        {u.role === 'admin' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <Crown size={10} /> {t('role_admin')}
                          </span>
                        ) : u.role === 'manager' ? (
                          <span className="flex items-center gap-1"><Shield size={10} /> {t('role_manager')}</span>
                        ) : u.role === 'member' ? (
                          <span>{t('role_member')}</span>
                        ) : (
                          <span>{t('role_guest')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {u.id === currentUser.id && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* Language selector toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowUserMenu(false);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Đổi ngôn ngữ"
          >
            {settings.language === 'vi' ? '🇻🇳' : settings.language === 'en' ? '🇬🇧' : '🇯🇵'}
          </button>

          {showLangMenu && (
            <div className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => {
                  setLanguage('vi');
                  setShowLangMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                  settings.language === 'vi' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>🇻🇳 Tiếng Việt</span>
                {settings.language === 'vi' && <Check size={14} />}
              </button>
              <button
                onClick={() => {
                  setLanguage('en');
                  setShowLangMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                  settings.language === 'en' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>🇬🇧 English</span>
                {settings.language === 'en' && <Check size={14} />}
              </button>
              <button
                onClick={() => {
                  setLanguage('ja');
                  setShowLangMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                  settings.language === 'ja' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>🇯🇵 日本語</span>
                {settings.language === 'ja' && <Check size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          title={settings.theme === 'dark' ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
        >
          {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          title="Thông báo khẩn"
        >
          <Bell size={16} />
          {urgentAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {urgentAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
