import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Coins, 
  Edit3, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Building,
  CircleDollarSign
} from 'lucide-react';
import { InvestmentAsset, AssetPnL, AssetClass } from '../../types/investment';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '../../services/investmentCalculator';

interface InvestmentAssetCardProps {
  asset: InvestmentAsset;
  pnl: AssetPnL;
  onSelectAsset?: (asset: InvestmentAsset) => void;
  onQuickUpdatePrice?: (asset: InvestmentAsset) => void;
}

export const InvestmentAssetCard: React.FC<InvestmentAssetCardProps> = ({
  asset,
  pnl,
  onSelectAsset,
  onQuickUpdatePrice
}) => {
  const isProfitable = pnl.unrealizedPnL >= 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getHoldingBadge = () => {
    switch (pnl.holdingCategory) {
      case 'long_term':
        return {
          label: `Dài hạn (${pnl.holdingPeriodLabel})`,
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          borderColor: 'border-emerald-200 dark:border-emerald-800'
        };
      case 'medium_term':
        return {
          label: `Trung hạn (${pnl.holdingPeriodLabel})`,
          bgColor: 'bg-blue-50 dark:bg-blue-950/60',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      default:
        return {
          label: `Ngắn hạn (${pnl.holdingPeriodLabel})`,
          bgColor: 'bg-amber-50 dark:bg-amber-950/60',
          textColor: 'text-amber-700 dark:text-amber-300',
          borderColor: 'border-amber-200 dark:border-amber-800'
        };
    }
  };

  const holdingBadge = getHoldingBadge();
  const classColor = ASSET_CLASS_COLORS[asset.assetClass] || '#64748b';

  return (
    <div 
      onClick={() => onSelectAsset?.(asset)}
      className="w-full bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Top Header: Symbol, Name, Category & Holding Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
            style={{ backgroundColor: classColor }}
          >
            {asset.symbol.slice(0, 3).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 dark:text-white">
                {asset.symbol}
              </span>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${classColor}18`,
                  color: classColor
                }}
              >
                {ASSET_CLASS_LABELS[asset.assetClass]}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-300 truncate max-w-[170px] sm:max-w-xs mt-0.5">
              {asset.name}
            </p>
          </div>
        </div>

        {/* Action: Quick Price Edit */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickUpdatePrice?.(asset);
          }}
          title="Sửa giá thị trường"
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition shrink-0"
        >
          <Edit3 size={15} />
        </button>
      </div>

      {/* Middle Row: Quantity & Current Value */}
      <div className="grid grid-cols-2 gap-3 my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
            Đang nắm giữ
          </span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 block">
            {asset.quantity.toLocaleString('vi-VN')} {asset.currency}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
            Giá vốn: {formatCurrency(asset.avgBuyPrice)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
            Giá trị thị trường
          </span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 block">
            {formatCurrency(pnl.currentValue)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
            Giá TT: {formatCurrency(asset.currentPrice)}
          </span>
        </div>
      </div>

      {/* Bottom Row: P&L Pill, Holding Period Badge, Dividend Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
        {/* P&L */}
        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold ${
          isProfitable 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {isProfitable ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{isProfitable ? '+' : ''}{formatCurrency(pnl.unrealizedPnL)}</span>
          <span>({isProfitable ? '+' : ''}{pnl.unrealizedPnLPercent.toFixed(2)}%)</span>
        </div>

        {/* Holding Period Badge */}
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${holdingBadge.bgColor} ${holdingBadge.textColor} ${holdingBadge.borderColor}`}>
          <Clock size={12} />
          <span>{holdingBadge.label}</span>
        </div>

        {/* Dividend Yield on Cost (if > 0) */}
        {pnl.totalDividends > 0 && (
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
            <Coins size={12} />
            <span>Cổ tức: +{formatCurrency(pnl.totalDividends)} (YoC: {pnl.yieldOnCost}%)</span>
          </div>
        )}
      </div>
    </div>
  );
};
