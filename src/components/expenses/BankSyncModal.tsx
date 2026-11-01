import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Wallet, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  Play, 
  Clipboard, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { 
  SUPPORTED_PAYMENT_APPS, 
  SAMPLE_BANK_NOTIFICATIONS, 
  parseBankNotification 
} from '../../services/bankingParserService';
import { 
  checkBankNotificationPermission, 
  openBankNotificationSettings,
  checkClipboardForBankTransaction
} from '../../services/bankListenerBridge';
import { Capacitor } from '@capacitor/core';
import { PaymentAppSource } from '../../types';

interface BankSyncModalProps {
  onClose: () => void;
}

export const BankSyncModal: React.FC<BankSyncModalProps> = ({ onClose }) => {
  const { 
    settings, 
    updateAppSettings, 
    addPendingBankTransaction, 
    categories 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'settings' | 'simulator'>('simulator');
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState('');
  const [pasteParsePreview, setPasteParsePreview] = useState<any>(null);
  const [simulatedSuccessId, setSimulatedSuccessId] = useState<string | null>(null);

  useEffect(() => {
    checkBankNotificationPermission().then(setHasPermission);
  }, []);

  const handleToggleAutoSuggest = () => {
    updateAppSettings({
      enableBankAutoSuggest: settings.enableBankAutoSuggest === false ? true : false
    });
  };

  const handleToggleClipboard = () => {
    updateAppSettings({
      enableClipboardCheck: settings.enableClipboardCheck === false ? true : false
    });
  };

  const handleParsePastedText = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setPasteParsePreview(null);
      return;
    }
    const parsed = parseBankNotification(text, 'clipboard', categories);
    setPasteParsePreview(parsed);
  };

  const handleAddPastedTransaction = () => {
    if (!pasteParsePreview) return;
    addPendingBankTransaction(pasteParsePreview);
    setPastedText('');
    setPasteParsePreview(null);
    onClose();
  };

  const handleTriggerSimulation = (sample: typeof SAMPLE_BANK_NOTIFICATIONS[0]) => {
    const parsed = parseBankNotification(sample.rawText, sample.source, categories);
    if (parsed) {
      addPendingBankTransaction(parsed);
      setSimulatedSuccessId(sample.id);
      setTimeout(() => {
        setSimulatedSuccessId(null);
        onClose();
      }, 400);
    }
  };

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Building2 size={20} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Đồng bộ Ngân hàng & Ví điện tử
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                Tự động nhận diện giao dịch MoMo, VCB, MB Bank, ZaloPay...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Giả lập & Dán nhanh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone size={14} />
            <span>Kết nối & Cài đặt</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {activeTab === 'simulator' ? (
            <div className="space-y-4">
              {/* Quick Paste Box */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clipboard size={14} className="text-indigo-500" />
                    Dán tin nhắn trừ tiền / Biên lai MoMo:
                  </span>
                  {pastedText && (
                    <button
                      type="button"
                      onClick={() => handleParsePastedText('')}
                      className="text-[10px] text-rose-500 hover:underline font-normal"
                    >
                      Xóa
                    </button>
                  )}
                </label>
                <textarea
                  rows={2}
                  value={pastedText}
                  onChange={e => handleParsePastedText(e.target.value)}
                  placeholder="Dán nội dung tin nhắn biến động số dư hoặc biên lai giao dịch vào đây..."
                  className="w-full p-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                />

                {/* Live Preview Card */}
                {pasteParsePreview && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        Nhận diện thành công ({pasteParsePreview.sourceAppName})
                      </span>
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                        -{pasteParsePreview.amount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {pasteParsePreview.suggestedTitle}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPastedTransaction}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition"
                    >
                      + Tạo Gợi ý Chi tiêu ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Instant Simulation Presets */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Play size={14} className="text-emerald-500" />
                    Thử nghiệm nhanh mẫu giao dịch:
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                    Bấm để gửi thông báo giả lập
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_BANK_NOTIFICATIONS.map(sample => {
                    const isSuccess = simulatedSuccessId === sample.id;
                    const meta = SUPPORTED_PAYMENT_APPS[sample.source] || SUPPORTED_PAYMENT_APPS.other;
                    return (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleTriggerSimulation(sample)}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-2 ${
                          isSuccess
                            ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 shadow-sm'
                            : 'bg-white dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span 
                              className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md text-white shrink-0"
                              style={{ backgroundColor: meta.color }}
                            >
                              {sample.badge}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {sample.title}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium mt-1 truncate">
                            {sample.rawText}
                          </div>
                        </div>

                        <div className="shrink-0 text-right pt-0.5">
                          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            -{sample.expectedAmount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Android Notification Listener Permission status */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Quyền Lắng nghe Thông báo Android
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium mt-0.5">
                        Cho phép FamLife tự động phát hiện thông báo trừ tiền từ MoMo và các ứng dụng Ngân hàng khi đang khóa máy.
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    hasPermission 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}>
                    {hasPermission ? 'Đã cấp quyền' : isNative ? 'Chưa bật' : 'Môi trường Web'}
                  </span>
                </div>

                {isNative && !hasPermission && (
                  <button
                    type="button"
                    onClick={openBankNotificationSettings}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98"
                  >
                    <span>Mở Cài đặt cấp quyền thông báo</span>
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                {/* Auto Suggest Toggle */}
                <div 
                  onClick={handleToggleAutoSuggest}
                  className="p-3 bg-white dark:bg-slate-700/60 rounded-2xl border border-slate-200 dark:border-slate-600 flex items-center justify-between cursor-pointer hover:border-slate-300"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Bật gợi ý chi tiêu tự động
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                      Hiển thị thanh gợi ý khi có biến động số dư trừ tiền
                    </div>
                  </div>
                  {settings.enableBankAutoSuggest !== false ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
                      ● Bật
                    </span>
                  ) : (
                    <span className="text-slate-400 font-bold text-base">
                      ○ Tắt
                    </span>
                  )}
                </div>

                {/* Clipboard Check Toggle */}
                <div 
                  onClick={handleToggleClipboard}
                  className="p-3 bg-white dark:bg-slate-700/60 rounded-2xl border border-slate-200 dark:border-slate-600 flex items-center justify-between cursor-pointer hover:border-slate-300"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Tự động quét Khay nhớ tạm (Clipboard)
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                      Gợi ý thêm chi tiêu khi bạn vừa copy tin nhắn trừ tiền
                    </div>
                  </div>
                  {settings.enableClipboardCheck !== false ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
                      ● Bật
                    </span>
                  ) : (
                    <span className="text-slate-400 font-bold text-base">
                      ○ Tắt
                    </span>
                  )}
                </div>
              </div>

              {/* Supported apps catalog */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  Ứng dụng được hỗ trợ sẵn:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(SUPPORTED_PAYMENT_APPS).map(([key, app]) => {
                    if (key === 'other' || key === 'clipboard') return null;
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-2xs"
                      >
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: app.color }} 
                        />
                        <span>{app.displayName}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
