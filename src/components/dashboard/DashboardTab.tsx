import React from 'react';
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
  TrendingUp
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { getTranslation } from '../../i18n';
import { generateAIInsights } from '../../services/aiService';
import { exportHouseholdReport } from '../../services/pdfService';
import { TabType } from '../layout/BottomNav';

interface DashboardTabProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenAddExpense: () => void;
  onOpenAddAsset: () => void;
  onOpenVoiceInput: () => void;
  onOpenQRScanner: () => void;
  onSelectAsset: (assetId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  onNavigateTab,
  onOpenAddExpense,
  onOpenAddAsset,
  onOpenVoiceInput,
  onOpenQRScanner,
  onSelectAsset,
}) => {
  const { assets, expenses, budgets, tasks, currentUser, settings, users } = useAppStore();
  const { portfolioSummary } = useInvestmentStore();
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

  const totalUrgent = warrantyExpiringAssets.length + urgentComponents.length;

  // Monthly expense calculation
  const currentMonthExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const budgetRatio = totalBudget > 0 ? Math.min(Math.round((currentMonthExpenses / totalBudget) * 100), 100) : 0;

  // AI insights
  const aiInsights = generateAIInsights(assets, expenses, budgets, settings.notifyDaysBeforeExpiry);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-5 text-white shadow-xl">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="text-xs text-indigo-200 font-medium">
              {t('dash_welcome')},
            </div>
            <h1 className="text-xl font-extrabold tracking-tight mt-0.5">
              {currentUser.name}
            </h1>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold">
              <span>🏆 {currentUser.points} XP</span>
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
        <div className="absolute top-0 right-10 w-20 h-20 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />
      </div>

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
            {/* Warranty Warnings */}
            {warrantyExpiringAssets.map(asset => {
              const diff = Math.ceil((new Date(asset.warrantyExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset(asset.id)}
                  className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-center justify-between cursor-pointer hover:border-rose-400 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                        {asset.name}
                      </div>
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                        {t('dash_warranty_expired_after', { days: diff, date: asset.warrantyExpiryDate })}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              );
            })}

            {/* Component Replacement Warnings */}
            {urgentComponents.map((comp, idx) => (
              <div
                key={idx}
                onClick={() => onSelectAsset(comp.assetId)}
                className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-center justify-between cursor-pointer hover:border-rose-400 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600">
                    <Wrench size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                      {comp.compName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {t('dash_component_of', { asset: comp.assetName, wear: comp.wear })}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {t('dash_view_now')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Grid */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          {t('action_quick_add')}
        </h2>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={onOpenAddExpense}
            className="flex flex-col items-center justify-center p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle size={20} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1.5 text-center leading-tight">
              {t('nav_expenses')}
            </span>
          </button>

          <button
            onClick={onOpenAddAsset}
            className="flex flex-col items-center justify-center p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle size={20} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1.5 text-center leading-tight">
              {t('nav_assets')}
            </span>
          </button>

          <button
            onClick={onOpenVoiceInput}
            className="flex flex-col items-center justify-center p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic size={20} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1.5 text-center leading-tight">
              {t('action_voice_input')}
            </span>
          </button>

          <button
            onClick={onOpenQRScanner}
            className="flex flex-col items-center justify-center p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode size={20} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1.5 text-center leading-tight">
              {t('action_scan_qr')}
            </span>
          </button>
        </div>
      </div>

      {/* Monthly Budget Summary Card */}
      <div
        onClick={() => onNavigateTab('expenses')}
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-400 transition space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              {t('dash_budget_status')}
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              {currentMonthExpenses.toLocaleString('vi-VN')} đ
              <span className="text-xs font-normal text-slate-500 ml-1">
                / {totalBudget > 0 ? `${totalBudget.toLocaleString('vi-VN')} đ` : 'Chưa đặt hạn mức'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalBudget === 0
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
            className={`h-full rounded-full transition-all duration-500 ${budgetRatio >= 90 ? 'bg-rose-500' : budgetRatio >= 70 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
            style={{ width: `${totalBudget > 0 ? budgetRatio : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300 pt-0.5">
          <span>
            {totalBudget > 0
              ? (currentMonthExpenses > totalBudget
                ? `Vượt: ${(currentMonthExpenses - totalBudget).toLocaleString('vi-VN')} đ`
                : `${t('dash_remaining_budget')}: ${(totalBudget - currentMonthExpenses).toLocaleString('vi-VN')} đ`)
              : 'Chưa thiết lập ngân sách'}
          </span>
          <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-semibold">
            {t('dash_view_details')} <ArrowUpRight size={12} />
          </span>
        </div>
      </div>

      {/* Investment Portfolio Summary Card */}
      <div
        onClick={() => onNavigateTab('investments')}
        className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-4 border border-indigo-800/80 shadow-md cursor-pointer hover:border-indigo-400 transition space-y-2 text-white relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <TrendingUp size={16} />
            </div>
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
              {t('inv_dash_card_title')}
            </span>
          </div>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${portfolioSummary.totalUnrealizedPnL >= 0
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
            {portfolioSummary.totalUnrealizedPnL >= 0 ? '+' : ''}{portfolioSummary.unrealizedPnLPercent.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <div className="text-lg font-black tracking-tight text-white">
              {portfolioSummary.currentMarketValue.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              {t('inv_invested_capital')}: {portfolioSummary.totalInvested.toLocaleString('vi-VN')} đ
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-extrabold block ${portfolioSummary.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
              {portfolioSummary.totalUnrealizedPnL >= 0 ? '+' : ''}{portfolioSummary.totalUnrealizedPnL.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[10px] text-indigo-300 flex items-center justify-end gap-0.5 mt-0.5 font-bold">
              {t('dash_view_details')} <ArrowUpRight size={10} />
            </span>
          </div>
        </div>
      </div>

      {/* AI Suggestions & Forecast */}
      {aiInsights.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles size={16} className="text-purple-500" />
              <span>{t('dash_ai_suggestions')}</span>
            </div>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
              AI Smart
            </span>
          </div>

          <div className="space-y-2">
            {aiInsights.slice(0, 2).map(item => (
              <div key={item.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur p-3 rounded-xl border border-purple-100 dark:border-purple-900/40 text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                  <span>{item.title}</span>
                  {item.estimatedSaving && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {t('dash_estimated_saving', { amount: item.estimatedSaving.toLocaleString('vi-VN') })}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {item.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => onNavigateTab('assets')}
          className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-400 transition"
        >
          <div className="text-xs text-slate-400 dark:text-slate-400 font-medium">
            {t('dash_total_assets')}
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {assets.length} <span className="text-xs font-normal text-slate-400">{t('dash_appliances_unit')}</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} />
            {assets.length > 0 ? t('dash_status_running_well') : t('dash_status_no_assets')}
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('family')}
          className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-400 transition"
        >
          <div className="text-xs text-slate-400 dark:text-slate-400 font-medium">
            {t('dash_active_tasks')}
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {tasks.filter(t => t.status === 'todo').length} <span className="text-xs font-normal text-slate-400">{t('dash_tasks_unit')}</span>
          </div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold flex items-center gap-1">
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
