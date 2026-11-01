import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Pencil, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard,
  Building2,
  Wallet,
  Zap,
  HelpCircle
} from 'lucide-react';
import { PendingBankTransaction, ExpenseCategory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { SUPPORTED_PAYMENT_APPS } from '../../services/bankingParserService';

interface BankTransactionSuggestionBannerProps {
  onEditTransaction: (tx: PendingBankTransaction) => void;
  onOpenSyncSettings?: () => void;
}

export const BankTransactionSuggestionBanner: React.FC<BankTransactionSuggestionBannerProps> = ({
  onEditTransaction,
  onOpenSyncSettings
}) => {
  const { 
    pendingTransactions, 
    confirmPendingBankTransaction, 
    dismissPendingBankTransaction, 
    categories 
  } = useAppStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [successAnimationId, setSuccessAnimationId] = useState<string | null>(null);

  if (!pendingTransactions || pendingTransactions.length === 0) {
    return null;
  }

  // Ensure index remains in bounds
  const safeIndex = Math.min(currentIndex, pendingTransactions.length - 1);
  const currentItem = pendingTransactions[safeIndex];
  if (!currentItem) return null;

  const appMeta = SUPPORTED_PAYMENT_APPS[currentItem.sourceApp] || SUPPORTED_PAYMENT_APPS.other;
  const targetCategory = categories.find(c => c.id === currentItem.suggestedCategory);

  const handleQuickConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSuccessAnimationId(currentItem.id);
    setTimeout(() => {
      confirmPendingBankTransaction(currentItem.id);
      setSuccessAnimationId(null);
      if (safeIndex >= pendingTransactions.length - 1 && safeIndex > 0) {
        setCurrentIndex(safeIndex - 1);
      }
    }, 450);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissPendingBankTransaction(currentItem.id);
    if (safeIndex >= pendingTransactions.length - 1 && safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    }
  };

  const getSourceIcon = () => {
    if (currentItem.sourceApp === 'momo' || currentItem.sourceApp === 'zalopay') {
      return <Wallet size={16} />;
    }
    if (currentItem.sourceApp === 'sms') {
      return <Zap size={16} />;
    }
    return <Building2 size={16} />;
  };

  return (
    <div className="w-full max-w-full overflow-hidden min-w-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-slate-800/90 dark:to-teal-950/40 rounded-3xl p-3.5 sm:p-4 border border-emerald-300/80 dark:border-emerald-700/60 shadow-sm space-y-3 animate-in fade-in duration-200">
      {/* Top row: Header, source badge & pagination */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-xl bg-emerald-500 text-white shadow-xs shrink-0">
            <Sparkles size={14} className="animate-pulse" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Gợi ý chi tiêu mới
              </span>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 text-white shadow-xs"
                style={{ backgroundColor: appMeta.color }}
              >
                {getSourceIcon()}
                <span>{currentItem.sourceAppName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Pager if multiple pending */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {pendingTransactions.length > 1 && (
            <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-700/70 backdrop-blur rounded-full px-2 py-0.5 border border-slate-200/60 dark:border-slate-600/60 text-[10px] font-bold text-slate-700 dark:text-slate-200">
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : pendingTransactions.length - 1))}
                className="hover:text-emerald-600 p-0.5"
                title="Giao dịch trước"
              >
                <ChevronLeft size={12} />
              </button>
              <span>{safeIndex + 1}/{pendingTransactions.length}</span>
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => (prev < pendingTransactions.length - 1 ? prev + 1 : 0))}
                className="hover:text-emerald-600 p-0.5"
                title="Giao dịch kế tiếp"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          {onOpenSyncSettings && (
            <button
              type="button"
              onClick={onOpenSyncSettings}
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
              title="Cài đặt đồng bộ ngân hàng"
            >
              <HelpCircle size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center transition active:scale-95"
            title="Bỏ qua gợi ý này"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Main card details */}
      <div className={`bg-white dark:bg-slate-800/90 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2.5 transition-all duration-300 ${
        successAnimationId === currentItem.id ? 'scale-98 opacity-50 bg-emerald-50 dark:bg-emerald-950/50' : ''
      }`}>
        {/* Title & Amount Row */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug truncate" title={currentItem.suggestedTitle}>
              {currentItem.suggestedTitle}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium line-clamp-1 mt-0.5 italic" title={currentItem.rawNotificationText}>
              "{currentItem.rawNotificationText}"
            </p>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 whitespace-nowrap tracking-tight">
              -{currentItem.amount.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        {/* Metadata row: Category chip, Date & XP bonus */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex-wrap min-w-0 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span 
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
              style={{
                backgroundColor: `${targetCategory?.color || '#10b981'}15`,
                color: targetCategory?.color || '#10b981',
                border: `1px solid ${targetCategory?.color || '#10b981'}30`
              }}
            >
              <span>{targetCategory?.icon || '🏷️'}</span>
              <span>{targetCategory?.name || currentItem.suggestedCategory}</span>
            </span>

            <span className="text-slate-500 dark:text-slate-300 font-medium shrink-0">
              {currentItem.date}
            </span>

            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
              +15 XP
            </span>
          </div>

          {/* Action Buttons: Quick Save (1-Touch) & Edit */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => onEditTransaction(currentItem)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95"
            >
              <Pencil size={12} className="text-slate-500 dark:text-slate-300" />
              <span>Chỉnh sửa</span>
            </button>

            <button
              type="button"
              onClick={handleQuickConfirm}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition active:scale-95"
            >
              <Check size={14} className="stroke-[3]" />
              <span>Lưu ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
