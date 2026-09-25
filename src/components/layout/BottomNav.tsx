import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Tv2, 
  Wallet, 
  Cpu, 
  Users, 
  Trophy, 
  Settings,
  MoreHorizontal,
  X,
  ChevronRight,
  Sparkles,
  Zap,
  Sliders,
  LucideIcon
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

export type TabType = 'dashboard' | 'assets' | 'expenses' | 'iot' | 'family' | 'game' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  urgentAssetsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onChangeTab,
  urgentAssetsCount 
}) => {
  const { settings } = useAppStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const t = (key: any) => getTranslation(settings.language, key);

  // 4 Core Main Tabs
  const primaryTabs: { id: TabType; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { id: 'assets', label: t('nav_assets'), icon: Tv2, badge: urgentAssetsCount },
    { id: 'expenses', label: t('nav_expenses'), icon: Wallet },
    { id: 'family', label: t('nav_family'), icon: Users },
  ];

  // Secondary tabs inside "More" menu
  const secondaryTabs = [
    { 
      id: 'iot' as TabType, 
      label: settings.language === 'vi' ? 'IoT Nhà thông minh' : settings.language === 'ja' ? 'スマートホーム (IoT)' : 'Smart Home (IoT)', 
      shortLabel: t('nav_iot'), 
      desc: t('nav_iot_desc'),
      icon: Cpu,
      color: 'bg-cyan-500'
    },
    { 
      id: 'game' as TabType, 
      label: settings.language === 'vi' ? 'Thử thách & Đua top' : t('nav_gamification'), 
      shortLabel: t('nav_gamification'), 
      desc: t('nav_game_desc'),
      icon: Trophy,
      color: 'bg-amber-500'
    },
    { 
      id: 'settings' as TabType, 
      label: t('nav_settings'), 
      shortLabel: t('nav_settings'), 
      desc: t('nav_settings_desc'),
      icon: Settings,
      color: 'bg-indigo-500'
    },
  ];

  // Determine the 5th button state
  const isSecondaryActive = activeTab === 'iot' || activeTab === 'game' || activeTab === 'settings';
  const activeSecondary = secondaryTabs.find(t => t.id === activeTab);

  const fifthTabIcon = activeSecondary ? activeSecondary.icon : MoreHorizontal;
  const fifthTabLabel = activeSecondary ? activeSecondary.shortLabel : t('nav_more');

  const handleSelectTab = (tabId: TabType) => {
    onChangeTab(tabId);
    setShowMoreMenu(false);
  };

  return (
    <>
      <nav 
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 pt-1.5 flex items-center justify-between sticky bottom-0 z-30 shrink-0 shadow-lg"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* 4 Core Tabs */}
        {primaryTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setShowMoreMenu(false);
                onChangeTab(tab.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={`transition-transform duration-200 ${isActive ? 'stroke-[2.5] scale-110' : 'stroke-2'}`} />
                {!!tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white rounded-full text-[9px] font-extrabold w-3.5 h-3.5 flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] xs:text-[11px] mt-1 tracking-tight leading-none whitespace-nowrap text-center block w-full ${
                isActive ? 'font-bold' : 'font-medium text-slate-500 dark:text-slate-300'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
              )}
            </button>
          );
        })}

        {/* 5th Tab: Active Secondary Tab OR "Thêm" Menu */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
            isSecondaryActive || showMoreMenu
              ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
              : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            {React.createElement(fifthTabIcon, {
              size: 20,
              className: `transition-transform duration-200 ${isSecondaryActive || showMoreMenu ? 'stroke-[2.5] scale-110' : 'stroke-2'}`
            })}
          </div>
          <span className={`text-[10px] xs:text-[11px] mt-1 tracking-tight leading-none whitespace-nowrap text-center block w-full ${
            isSecondaryActive || showMoreMenu ? 'font-bold' : 'font-medium text-slate-500 dark:text-slate-300'
          }`}>
            {fifthTabLabel}
          </span>
          {isSecondaryActive && (
            <span className="w-1.5 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
          )}
        </button>
      </nav>

      {/* "Thêm / Mở rộng" Bottom Sheet Modal */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center animate-in fade-in"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl p-5 shadow-2xl space-y-4 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            {/* Sheet Handle & Header */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2" />
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {t('nav_more_title')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 font-medium">
                  {t('nav_more_desc')}
                </p>
              </div>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition border border-transparent dark:border-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* 3 Secondary Cards with High-Contrast Dark Theme */}
            <div className="space-y-3">
              {secondaryTabs.map(item => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all text-left group ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 dark:border-indigo-400 shadow-md ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${item.color}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{item.label}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 rounded-full font-bold border border-indigo-200 dark:border-indigo-700">
                              {t('nav_viewing')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    <ChevronRight size={18} className="text-slate-400 dark:text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
