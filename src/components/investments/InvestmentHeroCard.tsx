import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Coins,
  Clock,
  RefreshCw,
  PieChart,
  ChevronDown
} from 'lucide-react';
import { PortfolioSummary } from '../../types/investment';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface InvestmentHeroCardProps {
  summary: PortfolioSummary;
  onOpenAddTransaction?: () => void;
  onSyncMarketPrices?: () => void;
  isSyncing?: boolean;
  showAllocation?: boolean;
  onToggleAllocation?: () => void;
}

export const InvestmentHeroCard: React.FC<InvestmentHeroCardProps> = ({
  summary,
  onOpenAddTransaction,
  onSyncMarketPrices,
  isSyncing = false,
  showAllocation = false,
  onToggleAllocation
}) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const isProfitable = summary.totalUnrealizedPnL >= 0;
  const isNetProfitable = summary.allTimeNetProfit >= 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-3.5 sm:p-4 text-white shadow-lg border border-indigo-700/50 space-y-2">
      {/* Decorative background glows */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top row: Label & Quick Actions */}
      <div className="flex items-center justify-between relative z-10 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-200 shrink-0">
            <Wallet size={13} />
          </div>
          <span className="text-xs font-bold tracking-wide text-indigo-100 whitespace-nowrap">
            {t('inv_total_market_val')}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onSyncMarketPrices && (
            <button
              onClick={onSyncMarketPrices}
              disabled={isSyncing}
              title={t('inv_action_sync_online')}
              className="h-6 sm:h-6.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 transition text-[10px] sm:text-[11px] font-bold text-emerald-200 border border-emerald-400/30 backdrop-blur-sm disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
            >
              <RefreshCw size={11} className={`shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? t('inv_syncing') : t('inv_action_sync_online')}</span>
              <span className="sm:hidden">{isSyncing ? t('inv_syncing_short') : t('inv_action_sync_short')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Big Market Value & P&L in compact alignment */}
      <div className="relative z-10 flex items-baseline justify-between gap-2 flex-wrap pt-0.5">
        <div className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
          {formatCurrency(summary.currentMarketValue)}
        </div>

        {/* P&L & ROI Pill */}
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${
          isProfitable
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }`}>
          {isProfitable ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{isProfitable ? '+' : ''}{formatCurrency(summary.totalUnrealizedPnL)}</span>
          <span className="opacity-90 font-black">({isProfitable ? '+' : ''}{summary.unrealizedPnLPercent.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Invested Capital Sub-text */}
      <div className="relative z-10 text-[11px] text-indigo-200/90 font-medium">
        {t('inv_invested_capital')}: <strong className="text-white font-bold">{formatCurrency(summary.totalInvested)}</strong>
      </div>

      {/* 3 Metric Cards Grid at Bottom */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/10 relative z-10">
        {/* Realized P&L */}
        <div className="bg-white/5 rounded-xl p-1.5 sm:p-2 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] font-medium text-slate-300 flex items-center gap-1 truncate">
            <PiggyBank size={11} className="text-amber-400 shrink-0" />
            <span className="truncate">{t('inv_realized_pnl')}</span>
          </span>
          <span className={`text-[11px] sm:text-xs font-bold mt-0.5 truncate ${summary.totalRealizedPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {summary.totalRealizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.totalRealizedPnL)}
          </span>
        </div>

        {/* Dividends */}
        <div className="bg-white/5 rounded-xl p-1.5 sm:p-2 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] font-medium text-slate-300 flex items-center gap-1 truncate">
            <Coins size={11} className="text-amber-300 shrink-0" />
            <span className="truncate">{t('inv_total_dividends')}</span>
          </span>
          <span className="text-[11px] sm:text-xs font-bold text-amber-300 mt-0.5 truncate">
            +{formatCurrency(summary.totalDividendsReceived)}
          </span>
        </div>

        {/* Average Holding */}
        <div className="bg-white/5 rounded-xl p-1.5 sm:p-2 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] font-medium text-slate-300 flex items-center gap-1 truncate">
            <Clock size={11} className="text-cyan-300 shrink-0" />
            <span className="truncate">{t('inv_holding_avg')}</span>
          </span>
          <span className="text-[11px] sm:text-xs font-bold text-cyan-300 mt-0.5 truncate">
            {t('inv_holding_days', { days: summary.averageHoldingDays })}
          </span>
        </div>
      </div>

      {/* Bottom Micro-actions: Allocation Chart Toggle Bar */}
      {onToggleAllocation && (
        <div className="pt-1.5 flex items-center justify-between text-[11px] text-indigo-100 border-t border-white/10 relative z-10">
          <span className="text-[10px] text-indigo-200/90 font-medium">
            {summary.allocationByClass.filter(i => i.value > 0).length} nhóm danh mục
          </span>
          <button
            type="button"
            onClick={onToggleAllocation}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 transition text-[11px] font-semibold text-white backdrop-blur-sm"
          >
            <PieChart size={11} className="text-indigo-300" />
            <span>{showAllocation ? 'Ẩn phân bổ' : 'Xem phân bổ'}</span>
            <ChevronDown size={11} className={`transform transition-transform duration-200 ${showAllocation ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};
