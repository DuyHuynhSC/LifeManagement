import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Coins,
  Clock,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { PortfolioSummary } from '../../types/investment';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface InvestmentHeroCardProps {
  summary: PortfolioSummary;
  onOpenQuickUpdate?: () => void;
  onOpenAddTransaction?: () => void;
  onSyncMarketPrices?: () => void;
  isSyncing?: boolean;
}

export const InvestmentHeroCard: React.FC<InvestmentHeroCardProps> = ({
  summary,
  onOpenQuickUpdate,
  onOpenAddTransaction,
  onSyncMarketPrices,
  isSyncing = false
}) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const isProfitable = summary.totalUnrealizedPnL >= 0;
  const isNetProfitable = summary.allTimeNetProfit >= 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-4 sm:p-5 text-white shadow-xl border border-indigo-700/50">
      {/* Decorative background glows */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top row: Label & Quick Actions */}
      <div className="flex items-center justify-between relative z-10 mb-3 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
          <div className="w-7 h-7 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-200 shrink-0">
            <Wallet size={15} />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-wide text-indigo-100 whitespace-nowrap">
            {t('inv_total_market_val')}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {onSyncMarketPrices && (
            <button
              onClick={onSyncMarketPrices}
              disabled={isSyncing}
              title={t('inv_action_sync_online')}
              className="h-7 sm:h-7.5 px-2 sm:px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 transition text-[10px] sm:text-[11px] font-bold text-emerald-200 border border-emerald-400/30 backdrop-blur-sm disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
            >
              <RefreshCw size={11} className={`shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? t('inv_syncing') : t('inv_action_sync_online')}</span>
              <span className="sm:hidden">{isSyncing ? t('inv_syncing_short') : t('inv_action_sync_short')}</span>
            </button>
          )}

          {onOpenQuickUpdate && (
            <button
              onClick={onOpenQuickUpdate}
              title={t('inv_action_update_price')}
              className="h-7 sm:h-7.5 px-2 sm:px-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-[10px] sm:text-[11px] font-bold text-indigo-100 backdrop-blur-sm border border-white/15 flex items-center gap-1 whitespace-nowrap"
            >
              <Edit3 size={11} className="shrink-0 text-indigo-200" />
              <span className="hidden sm:inline">{t('inv_action_update_price')}</span>
              <span className="sm:hidden">{t('inv_action_update_short')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Big Market Value */}
      <div className="relative z-10 my-1">
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {formatCurrency(summary.currentMarketValue)}
        </div>
      </div>

      {/* P&L & ROI Pill */}
      <div className="flex flex-wrap items-center gap-2 mt-2 relative z-10">
        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold ${isProfitable
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
          {isProfitable ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>
            {isProfitable ? '+' : ''}{formatCurrency(summary.totalUnrealizedPnL)}
          </span>
          <span className="opacity-90 font-black">
            ({isProfitable ? '+' : ''}{summary.unrealizedPnLPercent.toFixed(2)}%)
          </span>
        </div>

        <div className="text-xs font-semibold text-indigo-200 bg-white/10 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10">
          {t('inv_invested_capital')}: {formatCurrency(summary.totalInvested)}
        </div>
      </div>

      {/* 3 Metric Cards Grid at Bottom */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4 pt-3 border-t border-white/10 relative z-10">
        {/* Realized P&L */}
        <div className="bg-white/5 rounded-2xl p-2 sm:p-2.5 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 flex items-center gap-1 truncate">
            <PiggyBank size={12} className="text-amber-400 shrink-0" />
            <span className="truncate">{t('inv_realized_pnl')}</span>
          </span>
          <span className={`text-xs sm:text-sm font-extrabold mt-1 truncate ${summary.totalRealizedPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}>
            {summary.totalRealizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.totalRealizedPnL)}
          </span>
        </div>

        {/* Dividends */}
        <div className="bg-white/5 rounded-2xl p-2 sm:p-2.5 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 flex items-center gap-1 truncate">
            <Coins size={12} className="text-amber-300 shrink-0" />
            <span className="truncate">{t('inv_total_dividends')}</span>
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-amber-300 mt-1 truncate">
            +{formatCurrency(summary.totalDividendsReceived)}
          </span>
        </div>

        {/* Average Holding */}
        <div className="bg-white/5 rounded-2xl p-2 sm:p-2.5 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 flex items-center gap-1 truncate">
            <Clock size={12} className="text-cyan-300 shrink-0" />
            <span className="truncate">{t('inv_holding_avg')}</span>
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-cyan-300 mt-1 truncate">
            {t('inv_holding_days', { days: summary.averageHoldingDays })}
          </span>
        </div>
      </div>
    </div>
  );
};
