import React, { useState } from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  RotateCcw, 
  FileText, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  Sparkles,
  HeartHandshake,
  Crown,
  Trash2,
  Users,
  UploadCloud
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { exportHouseholdReport } from '../../services/pdfService';
import { exportBackupData } from '../../services/backupService';
import { UserManagementModal } from '../admin/UserManagementModal';
import { RestoreDataModal } from './RestoreDataModal';

export const SettingsTab: React.FC = () => {
  const { 
    settings, 
    setNotifyDaysBeforeExpiry, 
    setTheme, 
    setLanguage, 
    resetToDefaultData,
    clearAllData,
    currentUser,
    assets,
    expenses,
    users,
    budgets,
    tasks,
    iotDevices,
    badges
  } = useAppStore();

  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const notifyOptions = [
    { days: 1, label: t('settings_1_day'), desc: t('settings_1_day_desc') },
    { days: 3, label: t('settings_3_days'), desc: t('settings_3_days_desc') },
    { days: 7, label: t('settings_7_days'), desc: t('settings_7_days_desc') },
    { days: 14, label: t('settings_14_days'), desc: t('settings_14_days_desc') },
    { days: 30, label: t('settings_30_days'), desc: t('settings_30_days_desc') },
  ];

  const languages = [
    { code: 'vi' as const, name: 'Tiếng Việt', flag: '🇻🇳', default: true },
    { code: 'en' as const, name: 'English', flag: '🇬🇧', default: false },
    { code: 'ja' as const, name: '日本語', flag: '🇯🇵', default: false },
  ];

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const data = {
        version: 2,
        appName: 'FamLife',
        exportedAt: new Date().toISOString(),
        assets,
        expenses,
        users,
        budgets,
        tasks,
        iotDevices,
        badges,
        settings,
        currentUserId: currentUser.id
      };
      const res = await exportBackupData(data);
      if (res.success) {
        if (res.method === 'download') {
          alert('Tệp sao lưu JSON đã được tải về máy thành công!');
        }
      } else if (res.message) {
        alert(res.message);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Không thể tạo file sao lưu: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hết đồ dùng, chi tiêu, công việc và thiết bị IoT? Thao tác này sẽ dọn sạch toàn bộ dữ liệu và giữ lại tài khoản thành viên.')) {
      clearAllData();
      alert('Đã dọn sạch toàn bộ dữ liệu thành công!');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn cài đặt lại ứng dụng về trạng thái sạch ban đầu (chỉ giữ 1 Bố - Admin, xóa hết dữ liệu)?')) {
      resetToDefaultData();
      alert('Đã khôi phục về trạng thái sạch ban đầu!');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Sliders size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {t('settings_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
            {t('settings_subtitle')}
          </p>
        </div>
      </div>

      {/* SECTION 1: EXPIRY NOTIFICATION DAYS (YÊU CẦU ĐẶC BIỆT CỦA USER) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('settings_notify_expiry')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
              {t('settings_notify_desc')}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {notifyOptions.map(opt => {
            const isSelected = settings.notifyDaysBeforeExpiry === opt.days;
            return (
              <button
                key={opt.days}
                onClick={() => setNotifyDaysBeforeExpiry(opt.days)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {opt.label}
                    {opt.days === 7 && (
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-semibold">
                        {t('settings_suggested')}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-300 font-medium mt-0.5">
                    {opt.desc}
                  </div>
                </div>
                {isSelected ? (
                  <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2 border border-slate-100 dark:border-slate-700">
          <Sparkles size={14} className="text-amber-500 shrink-0" />
          <span>{t('settings_alert_tip', { days: settings.notifyDaysBeforeExpiry })}</span>
        </div>
      </div>

      {/* SECTION 2: DARK / LIGHT THEME (YÊU CẦU CỦA USER) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 shrink-0">
            {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('settings_theme')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
              {t('settings_theme_desc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              settings.theme === 'light'
                ? 'border-indigo-500 bg-indigo-50/60 text-indigo-900 font-bold ring-1 ring-indigo-500 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:text-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Sun size={22} />
            </div>
            <div className="text-xs">{t('settings_theme_light')}</div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              settings.theme === 'dark'
                ? 'border-indigo-500 bg-slate-900 text-indigo-300 font-bold ring-1 ring-indigo-500 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
              <Moon size={22} />
            </div>
            <div className="text-xs">{t('settings_theme_dark')}</div>
          </button>
        </div>
      </div>

      {/* SECTION 3: MULTI-LANGUAGE (YÊU CẦU CỦA USER: ANH, NHẬT, VIỆT - DEFAULT VIỆT) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
            <Globe size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('settings_lang')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
              {t('settings_lang_desc')}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {languages.map(l => {
            const isSelected = settings.language === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{l.flag}</span>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      {l.name}
                      {l.default && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                          {t('settings_lang_default_badge')}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                      {l.code === 'vi' ? t('settings_lang_vi_desc') : l.code === 'en' ? t('settings_lang_en_desc') : t('settings_lang_ja_desc')}
                    </div>
                  </div>
                </div>
                {isSelected && <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: DATA & BACKUP & PDF */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('settings_backup')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
              {t('settings_backup_desc')}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => exportHouseholdReport(assets, expenses, users)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <FileText size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {t('action_export_pdf')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                  {t('settings_export_pdf_desc')}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Download size={18} className={isExporting ? 'animate-bounce' : ''} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {t('settings_backup_json')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                  {isExporting ? t('backup_preparing') : t('settings_backup_json_desc')}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowRestoreModal(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <UploadCloud size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {t('settings_restore_json')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                  {t('settings_restore_json_desc')}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={handleResetData}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                <RotateCcw size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {t('settings_reset_data')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                  {t('settings_reset_data_desc')}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION: ADMIN PANEL (Chỉ dành cho Quản trị viên) */}
      {currentUser.role === 'admin' && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent dark:from-amber-950/40 dark:to-slate-900/40 rounded-2xl p-4 border border-amber-300 dark:border-amber-700/80 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300 shrink-0">
              <Crown size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('settings_admin_panel')}
                </h2>
                <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-extrabold px-2 py-0.5 rounded-full">
                  {t('settings_admin_role_badge')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
                {t('settings_admin_desc')}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => setShowUserManagementModal(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-800 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Users size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {t('settings_admin_manage_users')}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                    {t('settings_admin_manage_users_desc')}
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-200 dark:border-rose-900/80 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <Trash2 size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {t('settings_admin_clear_data')}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                    {t('settings_admin_clear_data_desc')}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* App Info Footer */}
      <div className="text-center py-3 space-y-1 text-slate-400 dark:text-slate-400 text-xs">
        <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
          <HeartHandshake size={14} className="text-rose-500" />
          <span>FamLife - Gia Đình Thông Minh v1.0.0</span>
        </div>
        <p className="text-[11px]">{t('settings_app_info')}</p>
      </div>

      {/* User Management Modal */}
      {showUserManagementModal && (
        <UserManagementModal onClose={() => setShowUserManagementModal(false)} />
      )}

      {/* Restore Data Modal */}
      {showRestoreModal && (
        <RestoreDataModal onClose={() => setShowRestoreModal(false)} />
      )}
    </div>
  );
};
