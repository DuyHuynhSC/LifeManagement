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
  CircleDollarSign,
  Calendar,
  PiggyBank
} from 'lucide-react';
import { InvestmentAsset, AssetPnL, AssetClass } from '../../types/investment';
import { 
  ASSET_CLASS_COLORS, 
  getAssetClassLabel, 
  formatHoldingPeriodText 
} from '../../services/investmentCalculator';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

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
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const isProfitable = pnl.unrealizedPnL >= 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const holdingPeriodStr = formatHoldingPeriodText(pnl.holdingDays, t);

  const getHoldingBadge = () => {
    switch (pnl.holdingCategory) {
      case 'long_term':
        return {
          label: `${t('inv_term_long')} (${holdingPeriodStr})`,
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          borderColor: 'border-emerald-200 dark:border-emerald-800'
        };
      case 'medium_term':
        return {
          label: `${t('inv_term_medium')} (${holdingPeriodStr})`,
          bgColor: 'bg-blue-50 dark:bg-blue-950/60',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      default:
        return {
          label: `${t('inv_term_short')} (${holdingPeriodStr})`,
          bgColor: 'bg-amber-50 dark:bg-amber-950/60',
          textColor: 'text-amber-700 dark:text-amber-300',
          borderColor: 'border-amber-200 dark:border-amber-800'
        };
    }
  };

  const holdingBadge = getHoldingBadge();
  const classColor = ASSET_CLASS_COLORS[asset.assetClass] || '#64748b';

  const getAssetUnit = (assetClass: AssetClass, symbol: string) => {
    switch (assetClass) {
      case 'stock':
        return 'CP';
      case 'fund':
        return 'CCQ';
      case 'gold':
        return 'chỉ';
      case 'crypto':
        return symbol;
      default:
        return '';
    }
  };

  return (
    <div 
      onClick={() => onSelectAsset?.(asset)}
      className="w-full max-w-full overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group min-w-0 space-y-2"
    >
      {/* Top Row: Symbol Icon, Symbol, Category & Market Value + P&L */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-2xs shrink-0"
            style={{ backgroundColor: classColor }}
          >
            {asset.symbol.slice(0, 3).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {asset.symbol}
              </span>
              <span 
                className="text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0"
                style={{
                  backgroundColor: `${classColor}18`,
                  color: classColor
                }}
              >
                {getAssetClassLabel(asset.assetClass, t)}
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400 truncate mt-0.5">
              {asset.name}
            </p>
          </div>
        </div>

        {/* Value & P&L */}
        <div className="shrink-0 text-right">
          <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(asset.assetClass === 'savings' ? (asset.avgBuyPrice + (asset.expectedInterest || 0)) : pnl.currentValue)}
          </div>
          <div className={`text-[10px] font-extrabold flex items-center justify-end gap-0.5 mt-0.5 ${
            isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isProfitable ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{isProfitable ? '+' : ''}{formatCurrency(asset.assetClass === 'savings' ? (asset.expectedInterest || 0) : pnl.unrealizedPnL)}</span>
            {asset.assetClass !== 'savings' && (
              <span>({isProfitable ? '+' : ''}{pnl.unrealizedPnLPercent.toFixed(1)}%)</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sub-row: Holding Details, Badges & Quick Edit */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-300">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {asset.assetClass === 'savings' ? (
            <>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Gốc: {formatCurrency(asset.avgBuyPrice)}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold">
                {asset.termMonths || 0}T • {asset.interestRate || 0}%/năm
              </span>
              {asset.maturityDate && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate">
                    Đáo hạn: {asset.maturityDate}
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                SL: {asset.quantity.toLocaleString('vi-VN')} {getAssetUnit(asset.assetClass, asset.symbol)}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>
                Giá vốn: {formatCurrency(asset.avgBuyPrice)}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className={`px-1.5 py-0.2 rounded font-bold ${holdingBadge.bgColor} ${holdingBadge.textColor}`}>
                {holdingBadge.label}
              </span>
              {pnl.totalDividends > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    Cổ tức: +{formatCurrency(pnl.totalDividends)}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Quick Edit Price Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickUpdatePrice?.(asset);
          }}
          title={asset.assetClass === 'savings' ? t('inv_card_edit_savings') : t('inv_card_edit_price')}
          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition active:scale-95 shrink-0"
        >
          <Edit3 size={13} />
        </button>
      </div>
    </div>
  );
};
