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
  UploadCloud,
  Tags
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { exportHouseholdReport } from '../../services/pdfService';
import { exportBackupData } from '../../services/backupService';
import { getInvestmentExportData, restoreInvestmentState } from '../../store/useInvestmentStore';
import { UserManagementModal } from '../admin/UserManagementModal';
import { RestoreDataModal } from './RestoreDataModal';
import { CategoryManagementModal } from './CategoryManagementModal';
import { BankSyncModal } from '../expenses/BankSyncModal';
import { Building2 } from 'lucide-react';

interface SettingsTabProps {
  onOpenBankSync?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onOpenBankSync }) => {
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
    categories,
    users,
    budgets,
    tasks,
    iotDevices,
    badges
  } = useAppStore();

  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showBankSyncModal, setShowBankSyncModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const invData = getInvestmentExportData();
      const data = {
        version: 2,
        appName: 'FamLife',
        exportedAt: new Date().toISOString(),
        assets,
        expenses,
        categories,
        users,
        budgets,
        tasks,
        iotDevices,
        badges,
        settings,
        currentUserId: currentUser.id,
        investments: {
          assets: invData.assets,
          transactions: invData.transactions,
          dividends: invData.dividends
        },
        investmentAssets: invData.assets,
        investmentTransactions: invData.transactions,
        investmentDividends: invData.dividends
      };
      const res = await exportBackupData(data);
      if (res.success) {
        if (res.method === 'download') {
          alert('Tệp sao lưu JSON (bao gồm Đồ dùng, Chi tiêu & Danh mục Đầu tư) đã được tải về máy thành công!');
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
    if (window.confirm('Bạn có chắc chắn muốn xóa hết đồ dùng, chi tiêu, công việc, thiết bị IoT và danh mục đầu tư? Thao tác này sẽ dọn sạch toàn bộ dữ liệu và giữ lại tài khoản thành viên.')) {
      clearAllData();
      restoreInvestmentState({ assets: [], transactions: [], dividends: [] });
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

      {/* SECTION 1: EXPIRY NOTIFICATION DAYS (Slider 1 - 30 ngày) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
              <Bell size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {t('settings_notify_expiry')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
                {t('settings_notify_desc')}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black text-sm border border-amber-200 dark:border-amber-800 shadow-2xs">
              {settings.notifyDaysBeforeExpiry} ngày
            </span>
          </div>
        </div>

        {/* Range Slider from 1 to 30 */}
        <div className="space-y-2 pt-1">
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={settings.notifyDaysBeforeExpiry}
            onChange={e => setNotifyDaysBeforeExpiry(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          {/* Quick Marks */}
          <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-400 px-0.5">
            <button type="button" onClick={() => setNotifyDaysBeforeExpiry(1)} className="hover:text-amber-600">1 ngày</button>
            <button type="button" onClick={() => setNotifyDaysBeforeExpiry(7)} className="hover:text-amber-600">7 ngày</button>
            <button type="button" onClick={() => setNotifyDaysBeforeExpiry(14)} className="hover:text-amber-600">14 ngày</button>
            <button type="button" onClick={() => setNotifyDaysBeforeExpiry(30)} className="hover:text-amber-600">30 ngày</button>
          </div>
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

      {/* SECTION 3: MULTI-LANGUAGE (Combobox 3 ngôn ngữ) */}
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

        <div className="pt-1">
          <select
            value={settings.language}
            onChange={e => setLanguage(e.target.value as any)}
            className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
          >
            <option value="vi">🇻🇳 Tiếng Việt (Mặc định)</option>
            <option value="en">🇬🇧 English</option>
            <option value="ja">🇯🇵 日本語</option>
          </select>
        </div>
      </div>

      {/* SECTION: EXPENSE CATEGORIES MANAGEMENT */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 shrink-0">
            <Tags size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Danh mục Chi tiêu
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Tùy chỉnh, thêm mới, sửa hoặc xóa các nhóm danh mục chi tiêu ({categories.length} nhóm)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCategoryModal(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100/60 dark:hover:bg-teal-900/40 transition text-left group active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500 text-white shadow-sm">
              <Sliders size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-teal-900 dark:text-teal-200 group-hover:text-teal-700 dark:group-hover:text-teal-100">
                Quản lý Thêm / Sửa / Xóa Danh mục
              </div>
              <div className="text-[10px] text-teal-700/90 dark:text-teal-300/90 font-medium">
                Bấm để mở bảng điều khiển quản lý danh mục ({categories.length} danh mục)
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
            Chi tiết →
          </span>
        </button>
      </div>

      {/* SECTION: BANK & MOMO SYNC */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Đồng bộ Ngân hàng & Ví MoMo
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Tự động bắt thông báo chuyển tiền và gợi ý thêm mới chi tiêu tức thì
            </p>
          </div>
        </div>

        <div className="pt-1">
          <button
            onClick={() => {
              if (onOpenBankSync) {
                onOpenBankSync();
              } else {
                setShowBankSyncModal(true);
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 transition text-left group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-100">
                  Cài đặt Đồng bộ & Giả lập giao dịch
                </div>
                <div className="text-[10px] text-indigo-700/90 dark:text-indigo-300/90 font-medium">
                  {settings.enableBankAutoSuggest !== false ? 'Đang bật tự động gợi ý' : 'Đang tắt tự động gợi ý'} • Quét clipboard
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Chi tiết →
            </span>
          </button>
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

      {/* Category Management Modal */}
      {showCategoryModal && (
        <CategoryManagementModal onClose={() => setShowCategoryModal(false)} />
      )}

      {/* Restore Data Modal */}
      {showRestoreModal && (
        <RestoreDataModal onClose={() => setShowRestoreModal(false)} />
      )}

      {/* Bank & MoMo Sync Modal */}
      {showBankSyncModal && (
        <BankSyncModal onClose={() => setShowBankSyncModal(false)} />
      )}
    </div>
  );
};
