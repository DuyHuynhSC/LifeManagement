import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileJson, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ClipboardPaste,
  ShieldAlert,
  Calendar,
  Box,
  CreditCard,
  Users,
  CheckSquare,
  TrendingUp
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { validateBackupData, readBackupFile, BackupData, BackupSummary } from '../../services/backupService';

interface RestoreDataModalProps {
  onClose: () => void;
}

export const RestoreDataModal: React.FC<RestoreDataModalProps> = ({ onClose }) => {
  const { settings, restoreData } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedData, setValidatedData] = useState<BackupData | null>(null);
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessJSON = (text: string, sourceFileName?: string) => {
    setError(null);
    setValidatedData(null);
    setSummary(null);

    const result = validateBackupData(text);
    if (!result.valid || !result.data || !result.summary) {
      setError(result.error || t('restore_invalid_file'));
      return;
    }

    setValidatedData(result.data);
    setSummary(result.summary);
    if (sourceFileName) {
      setFileName(sourceFileName);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const text = await readBackupFile(file);
      setJsonText(text);
      handleProcessJSON(text, file.name);
    } catch (err: any) {
      setError(err?.message || 'Không thể đọc tệp tin');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setJsonText(text);
          setShowPasteArea(true);
          handleProcessJSON(text, 'Dán từ clipboard');
        } else {
          setError('Bộ nhớ tạm đang trống!');
        }
      } else {
        setShowPasteArea(true);
      }
    } catch {
      setShowPasteArea(true);
    }
  };

  const handleConfirmRestore = () => {
    if (!validatedData) return;

    const confirmMsg = t('restore_warning');
    if (!window.confirm(confirmMsg)) {
      return;
    }

    const res = restoreData(validatedData);
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(res.message || 'Khôi phục dữ liệu thất bại');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <RotateCcw size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {t('restore_modal_title')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
                {t('settings_restore_json_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Success Banner */}
          {isSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                {t('restore_success')}
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-200 font-medium">
                Ứng dụng đã được cập nhật toàn bộ dữ liệu mới.
              </p>
            </div>
          )}

          {!isSuccess && (
            <>
              {/* Option 1: File Input Button */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition group cursor-pointer"
                >
                  <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                    <UploadCloud size={28} />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {fileName ? fileName : t('restore_select_file')}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-300 font-medium mt-1">
                    Nhấn để chọn tệp .json từ thiết bị của bạn
                  </span>
                </button>

                {/* Option 2: Paste Clipboard / Text */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <ClipboardPaste size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Dán từ bộ nhớ tạm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPasteArea(!showPasteArea)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    {showPasteArea ? 'Ẩn ô nhập JSON' : 'Nhập mã JSON'}
                  </button>
                </div>

                {showPasteArea && (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={jsonText}
                      onChange={e => {
                        setJsonText(e.target.value);
                        handleProcessJSON(e.target.value);
                      }}
                      placeholder='Dán nội dung JSON vào đây (ví dụ: {"assets": [...], "expenses": [...]})'
                      rows={5}
                      className="w-full text-base sm:text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                  <div className="text-xs font-medium leading-relaxed">
                    {error}
                  </div>
                </div>
              )}

              {/* Preview Summary when Valid */}
              {summary && validatedData && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <FileJson size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      {t('restore_preview_title')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        <Box size={18} />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">
                          {summary.assetsCount}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                          Đồ dùng & Thiết bị
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">
                          {summary.expensesCount}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                          Khoản chi tiêu
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                        <Users size={18} />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">
                          {summary.usersCount}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                          Thành viên gia đình
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        <CheckSquare size={18} />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">
                          {summary.tasksCount}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                          Công việc gia đình
                        </div>
                      </div>
                    </div>

                    {/* Investment Portfolio Preview Card */}
                    {(summary.investmentsCount > 0 || summary.investmentTransactionsCount > 0 || summary.dividendsCount > 0) && (
                      <div className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/60 dark:to-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                            <TrendingUp size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {summary.investmentsCount} mã tài sản đầu tư
                            </div>
                            <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                              {summary.investmentTransactionsCount} lệnh giao dịch • {summary.dividendsCount} lượt cổ tức
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                          Đầu tư
                        </span>
                      </div>
                    )}
                  </div>

                  {summary.exportedAt && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Ngày sao lưu: {new Date(summary.exportedAt).toLocaleString('vi-VN')}</span>
                    </div>
                  )}

                  {/* Warning Notice */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200">
                    <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div className="text-xs font-medium leading-relaxed">
                      {t('restore_warning')}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isSuccess ? 'Đóng' : 'Hủy bỏ'}
          </button>

          {!isSuccess && (
            <button
              type="button"
              disabled={!validatedData}
              onClick={handleConfirmRestore}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition ${
                validatedData
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-200 dark:shadow-none'
                  : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <RotateCcw size={16} />
              <span>{t('restore_btn_confirm')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
