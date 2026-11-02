import React, { useMemo } from 'react';
import {
  AlertTriangle,
  PlusCircle,
  Mic,
  QrCode,
  FileText,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Wrench,
  CheckCircle2,
  ShieldAlert,
  Zap,
  TrendingUp,
  Pill,
  Calendar
} from 'lucide-react';
import { useAppStore, getCurrentYearMonth } from '../../store/useAppStore';
import { formatYearMonthDisplay } from '../expenses/BudgetModal';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { getTranslation } from '../../i18n';
import { generateAIInsights } from '../../services/aiService';
import { exportHouseholdReport } from '../../services/pdfService';
import { TabType } from '../layout/BottomNav';
import { BankTransactionSuggestionBanner } from '../expenses/BankTransactionSuggestionBanner';
import { PendingBankTransaction } from '../../types';

interface DashboardTabProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenAddExpense: () => void;
  onOpenAddAsset: () => void;
  onOpenVoiceInput: () => void;
  onOpenQRScanner: () => void;
  onSelectAsset: (assetId: string) => void;
  onEditBankTransaction?: (tx: PendingBankTransaction) => void;
  onOpenBankSync?: () => void;
  onOpenMedicineCabinet?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  onNavigateTab,
  onOpenAddExpense,
  onOpenAddAsset,
  onOpenVoiceInput,
  onOpenQRScanner,
  onSelectAsset,
  onEditBankTransaction,
  onOpenBankSync,
  onOpenMedicineCabinet,
}) => {
  const { assets, expenses, budgets, tasks, currentUser, settings, users, pendingTransactions, recurringBills, medicineItems } = useAppStore();
  const { portfolioSummary, assets: investmentAssets, transactions: investmentTransactions } = useInvestmentStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  // Calculate urgent alerts based on settings.notifyDaysBeforeExpiry
  const today = new Date();

  // 1. Warranty expiring items
  const warrantyExpiringAssets = assets.filter(asset => {
    const exp = new Date(asset.warrantyExpiryDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= settings.notifyDaysBeforeExpiry;
  });

  // 2. Components wearing out (wear <= 20%)
  const urgentComponents: { assetId: string; assetName: string; compName: string; wear: number; cost: number }[] = [];
  assets.forEach(asset => {
    asset.components.forEach(comp => {
      if (comp.currentWearPercent <= 20) {
        urgentComponents.push({
          assetId: asset.id,
          assetName: asset.name,
          compName: comp.name,
          wear: comp.currentWearPercent,
          cost: comp.replacementCost
        });
      }
    });
  });

  // 3. Urgent Recurring Bills (quá hạn hoặc đến hạn <= 5 ngày)
  const urgentBills = recurringBills.map(b => {
    const due = new Date(b.nextDueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { ...b, diffDays };
  }).filter(b => b.diffDays <= (settings.notifyDaysBeforeExpiry || 5));

  // 4. Urgent Medicine Items (quá hạn hoặc hết hạn trong vòng 30 ngày)
  const urgentMedicines = medicineItems.map(m => {
    const exp = new Date(m.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { ...m, diffDays };
  }).filter(m => m.diffDays <= 30);

  const totalUrgent = warrantyExpiringAssets.length + urgentComponents.length + urgentBills.length + urgentMedicines.length;

  // Monthly expense calculation
  const currentMonth = getCurrentYearMonth();
  const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth)).reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.filter(b => (b.month || currentMonth) === currentMonth).reduce((sum, b) => sum + b.monthlyLimit, 0);
  const budgetRatio = totalBudget > 0 ? Math.min(Math.round((currentMonthExpenses / totalBudget) * 100), 100) : 0;

  // AI insights
  const aiInsights = useMemo(() => generateAIInsights(
    assets,
    expenses,
    budgets,
    settings.notifyDaysBeforeExpiry,
    investmentAssets,
    portfolioSummary,
    investmentTransactions
  ), [assets, expenses, budgets, settings.notifyDaysBeforeExpiry, investmentAssets, portfolioSummary, investmentTransactions]);

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'investment':
        return {
          label: t('dash_ai_cat_investment'),
          icon: <TrendingUp size={11} className="shrink-0" />,
          className: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80'
        };
      case 'budget':
        return {
          label: t('dash_ai_cat_budget'),
          icon: <AlertTriangle size={11} className="shrink-0" />,
          className: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80'
        };
      case 'maintenance':
        return {
          label: t('dash_ai_cat_maintenance'),
          icon: <Wrench size={11} className="shrink-0" />,
          className: 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80'
        };
      default:
        return {
          label: t('dash_ai_cat_general'),
          icon: <Sparkles size={11} className="shrink-0" />,
          className: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80'
        };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-sky-700 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-sky-500/30">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="text-xs text-sky-100 font-medium">
              {t('dash_welcome')},
            </div>
            <h1 className="text-xl font-extrabold tracking-tight mt-0.5">
              {currentUser.name}
            </h1>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold">
              <span className="font-mono tabular-nums">🏆 {currentUser.points} XP</span>
              <span className="opacity-60">•</span>
              <span className="capitalize">{currentUser.role}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-2xl shadow-inner">
            {currentUser.avatar}
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-10 w-20 h-20 bg-sky-400/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* BANK / MOMO TRANSACTION SUGGESTION BANNER */}
      {onEditBankTransaction && (
        <BankTransactionSuggestionBanner
          onEditTransaction={onEditBankTransaction}
          onOpenSyncSettings={onOpenBankSync}
        />
      )}

      {/* URGENT ALERTS SECTION (DỰA THEO SETTING SỐ NGÀY THÔNG BÁO) */}
      {totalUrgent > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
              <AlertTriangle size={18} className="animate-bounce" />
              <span>{t('dash_urgent_title')} ({totalUrgent})</span>
            </div>
            <span className="text-[10px] text-rose-600/80 font-medium bg-rose-100 dark:bg-rose-900/80 px-2 py-0.5 rounded-full">
              {t('dash_alert_threshold', { days: settings.notifyDaysBeforeExpiry })}
            </span>
          </div>

          <div className="space-y-2">
            {/* Medicine Expiry Warnings */}
            {urgentMedicines.map(med => (
              <div
                key={med.id}
                onClick={() => onOpenMedicineCabinet?.()}
                className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-rose-300 dark:border-rose-800/80 flex items-center justify-between gap-2.5 cursor-pointer hover:border-rose-500 transition shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 shrink-0">
                    <Pill size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {med.name}
                      </span>
                      <span className="text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.2 rounded shrink-0">
                        Tủ thuốc
                      </span>
                    </div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold font-mono tabular-nums truncate mt-0.5">
                      {med.diffDays < 0 ? `ĐÃ HẾT HẠN (${Math.abs(med.diffDays)} ngày trước)` : `Hết hạn sau ${med.diffDays} ngày (${med.expiryDate})`}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                  Xem ngay
                </span>
              </div>
            ))}

            {/* Recurring Bills Warnings */}
            {urgentBills.map(bill => (
              <div
                key={bill.id}
                onClick={() => onNavigateTab('expenses')}
                className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-teal-300 dark:border-teal-800/80 flex items-center justify-between gap-2.5 cursor-pointer hover:border-teal-500 transition shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {bill.title}
                      </span>
                      <span className="text-[9px] font-black bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 px-1.5 py-0.2 rounded font-mono shrink-0">
                        {bill.amount.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className={`text-[10px] font-semibold font-mono tabular-nums truncate mt-0.5 ${bill.diffDays < 0 ? 'text-rose-600' : 'text-teal-700 dark:text-teal-300'}`}>
                      {bill.diffDays < 0 ? `Quá hạn đóng tiền (${Math.abs(bill.diffDays)} ngày)` : `Đến hạn sau ${bill.diffDays} ngày (${bill.nextDueDate})`}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 shrink-0">
                  Đóng tiền
                </span>
              </div>
            ))}

            {/* Warranty Warnings */}
            {warrantyExpiringAssets.map(asset => {
              const diff = Math.ceil((new Date(asset.warrantyExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset(asset.id)}
                  className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-2.5 cursor-pointer hover:border-rose-400 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 shrink-0">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {asset.name}
                      </div>
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold font-mono tabular-nums truncate mt-0.5">
                        {t('dash_warranty_expired_after', { days: diff, date: asset.warrantyExpiryDate })}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </div>
              );
            })}

            {/* Component Replacement Warnings */}
            {urgentComponents.map((comp, idx) => (
              <div
                key={idx}
                onClick={() => onSelectAsset(comp.assetId)}
                className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-2.5 cursor-pointer hover:border-rose-400 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 shrink-0">
                    <Wrench size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {comp.compName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {t('dash_component_of', { asset: comp.assetName, wear: comp.wear })}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                  {t('dash_view_now')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Grid */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          {t('action_quick_add')}
        </h2>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          <button
            onClick={onOpenAddExpense}
            className="flex flex-col items-center justify-center p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-primary-400 transition group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle size={19} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1.5 text-center leading-tight truncate w-full">
              {t('nav_expenses')}
            </span>
          </button>

          <button
            onClick={onOpenAddAsset}
            className="flex flex-col items-center justify-center p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-primary-400 transition group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle size={19} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1.5 text-center leading-tight truncate w-full">
              {t('nav_assets')}
            </span>
          </button>

          <button
            onClick={onOpenVoiceInput}
            className="flex flex-col items-center justify-center p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-primary-400 transition group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic size={19} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1.5 text-center leading-tight truncate w-full">
              {t('action_voice_input')}
            </span>
          </button>

          <button
            onClick={onOpenQRScanner}
            className="flex flex-col items-center justify-center p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-primary-400 transition group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode size={19} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1.5 text-center leading-tight truncate w-full">
              {t('action_scan_qr')}
            </span>
          </button>

          {onOpenMedicineCabinet && (
            <button
              onClick={onOpenMedicineCabinet}
              className="flex flex-col items-center justify-center p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-rose-400 transition group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Pill size={19} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1.5 text-center leading-tight truncate w-full">
                Tủ thuốc
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Monthly Budget Summary Card */}
      <div
        onClick={() => onNavigateTab('expenses')}
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm cursor-pointer hover:border-primary-400 transition space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('dash_budget_status')} ({formatYearMonthDisplay(currentMonth)})
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              <span className="font-mono tabular-nums">{currentMonthExpenses.toLocaleString('vi-VN')}</span> đ
              <span className="text-xs font-normal text-slate-500 ml-1">
                / {totalBudget > 0 ? <><span className="font-mono tabular-nums">{totalBudget.toLocaleString('vi-VN')}</span> đ</> : 'Chưa đặt hạn mức'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono tabular-nums ${totalBudget === 0
              ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              : budgetRatio >= 90
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                : budgetRatio >= 70
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
              }`}>
              {totalBudget > 0 ? `${budgetRatio}%` : 'Chưa đặt'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${budgetRatio >= 90 ? 'bg-rose-500' : budgetRatio >= 70 ? 'bg-amber-500' : 'bg-primary-600'
              }`}
            style={{ width: `${totalBudget > 0 ? budgetRatio : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300 pt-0.5">
          <span>
            {totalBudget > 0
              ? (currentMonthExpenses > totalBudget
                ? <>Vượt: <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400 font-bold">{(currentMonthExpenses - totalBudget).toLocaleString('vi-VN')}</span> đ</>
                : <>{t('dash_remaining_budget')}: <span className="font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">{(totalBudget - currentMonthExpenses).toLocaleString('vi-VN')}</span> đ</>)
              : 'Chưa thiết lập ngân sách'}
          </span>
          <span className="flex items-center gap-0.5 text-primary-600 dark:text-primary-400 font-semibold">
            {t('dash_view_details')} <ArrowUpRight size={12} />
          </span>
        </div>
      </div>

      {/* Investment Portfolio Summary Card */}
      <div
        onClick={() => onNavigateTab('investments')}
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm cursor-pointer hover:border-primary-400 transition space-y-2 relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <TrendingUp size={16} />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('inv_dash_card_title')}
            </span>
          </div>
          <span className={`text-[11px] font-black font-mono tabular-nums px-2 py-0.5 rounded-full ${portfolioSummary.totalUnrealizedPnL >= 0
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
            }`}>
            {portfolioSummary.totalUnrealizedPnL >= 0 ? '+' : ''}{portfolioSummary.unrealizedPnLPercent.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
              {portfolioSummary.currentMarketValue.toLocaleString('vi-VN')} <span className="text-xs font-bold font-sans text-slate-400">đ</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {t('inv_invested_capital')}: <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">{portfolioSummary.totalInvested.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-extrabold font-mono tabular-nums block ${portfolioSummary.totalUnrealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
              {portfolioSummary.totalUnrealizedPnL >= 0 ? '+' : ''}{portfolioSummary.totalUnrealizedPnL.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[10px] text-primary-600 dark:text-primary-400 flex items-center justify-end gap-0.5 mt-0.5 font-bold">
              {t('dash_view_details')} <ArrowUpRight size={10} />
            </span>
          </div>
        </div>
      </div>

      {/* AI Suggestions & Forecast */}
      {aiInsights.length > 0 && (
        <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900/40 border border-purple-200/80 dark:border-purple-800/50 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-extrabold text-xs uppercase tracking-wider min-w-0">
              <Sparkles size={16} className="text-purple-500 shrink-0" />
              <span className="truncate">{t('dash_ai_suggestions')}</span>
            </div>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold shrink-0 border border-purple-200/60 dark:border-purple-800">
              {t('dash_ai_smart_badge')}
            </span>
          </div>

          <div className="space-y-2.5">
            {aiInsights.slice(0, 3).map(item => {
              const catBadge = getCategoryBadge(item.category);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.targetTab) onNavigateTab(item.targetTab);
                  }}
                  className={`bg-white/95 dark:bg-slate-800/90 backdrop-blur p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/40 text-xs shadow-2xs transition hover:border-purple-300 dark:hover:border-purple-700 ${item.targetTab ? 'cursor-pointer' : ''}`}
                >
                  {/* Category Pill & Metric Pill row (No collision) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${catBadge.className}`}>
                      {catBadge.icon}
                      <span className="truncate max-w-[150px]">{catBadge.label}</span>
                    </span>

                    {item.metric ? (
                      <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0">
                        {item.metric}
                      </span>
                    ) : item.estimatedSaving ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        +{t('dash_estimated_saving', { amount: item.estimatedSaving.toLocaleString('vi-VN') })}
                      </span>
                    ) : null}
                  </div>

                  {/* Title row */}
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 mt-2 leading-snug break-words">
                    {item.title}
                  </h4>

                  {/* Message */}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed break-words">
                    {item.message}
                  </p>

                  {/* Action Link (CTA) */}
                  {item.actionText && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 inline-flex items-center gap-1 hover:underline">
                        {item.actionText}
                        <ArrowUpRight size={12} />
                      </span>
                      {item.priority === 'high' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 uppercase">
                          Cần lưu ý
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => onNavigateTab('assets')}
          className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm cursor-pointer hover:border-primary-400 transition"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('dash_total_assets')}
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            <span className="font-mono tabular-nums">{assets.length}</span> <span className="text-xs font-normal text-slate-400">{t('dash_appliances_unit')}</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} />
            {assets.length > 0 ? t('dash_status_running_well') : t('dash_status_no_assets')}
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('family')}
          className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm cursor-pointer hover:border-primary-400 transition"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('dash_active_tasks')}
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            <span className="font-mono tabular-nums">{tasks.filter(t => t.status === 'todo').length}</span> <span className="text-xs font-normal text-slate-400">{t('dash_tasks_unit')}</span>
          </div>
          <div className="text-[10px] text-primary-600 dark:text-primary-400 mt-1 font-semibold flex items-center gap-1">
            <Zap size={12} />
            {t('dash_claim_xp')}
          </div>
        </div>
      </div>

      {/* Report PDF Button */}
      <button
        onClick={() => exportHouseholdReport(assets, expenses, users)}
        className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition border border-slate-200 dark:border-slate-700"
      >
        <FileText size={16} />
        {t('action_export_pdf')}
      </button>
    </div>
  );
};
