import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Coins, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { PortfolioSummary } from '../../types/investment';

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
  const isProfitable = summary.totalUnrealizedPnL >= 0;
  const isNetProfitable = summary.allTimeNetProfit >= 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-5 text-white shadow-xl border border-indigo-700/50">
      {/* Decorative background glows */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top row: Label & Quick Actions */}
      <div className="flex items-center justify-between relative z-10 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-200">
            <Wallet size={18} />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-200">
            Tổng giá trị Danh mục
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onSyncMarketPrices && (
            <button
              onClick={onSyncMarketPrices}
              disabled={isSyncing}
              title="Đồng bộ giá thị trường trực tuyến (Cổ phiếu & Crypto)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/35 active:scale-95 transition text-xs font-semibold text-emerald-200 border border-emerald-400/30 backdrop-blur-sm disabled:opacity-50"
            >
              <RefreshCw size={13} className={`text-emerald-300 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang lấy giá...' : 'Lấy giá online'}</span>
            </button>
          )}

          {onOpenQuickUpdate && (
            <button
              onClick={onOpenQuickUpdate}
              title="Cập nhật giá thủ công"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition text-xs font-semibold text-indigo-100 backdrop-blur-sm border border-white/10"
            >
              <span>Sửa giá</span>
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
        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold ${
          isProfitable 
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

        <div className="text-xs font-semibold text-indigo-200 bg-white/10 px-2 py-1 rounded-xl backdrop-blur-sm">
          Vốn: {formatCurrency(summary.totalInvested)}
        </div>
      </div>

      {/* 3 Metric Cards Grid at Bottom */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/10 relative z-10">
        {/* Realized P&L */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
            <PiggyBank size={12} className="text-amber-400" />
            Đã chốt
          </span>
          <span className={`text-xs sm:text-sm font-extrabold mt-0.5 ${
            summary.totalRealizedPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'
          }`}>
            {summary.totalRealizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.totalRealizedPnL)}
          </span>
        </div>

        {/* Dividends */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
            <Coins size={12} className="text-amber-300" />
            Cổ tức
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-amber-300 mt-0.5">
            +{formatCurrency(summary.totalDividendsReceived)}
          </span>
        </div>

        {/* Average Holding */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
            <Clock size={12} className="text-cyan-300" />
            Nắm giữ TB
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-cyan-300 mt-0.5">
            {summary.averageHoldingDays} ngày
          </span>
        </div>
      </div>
    </div>
  );
};
