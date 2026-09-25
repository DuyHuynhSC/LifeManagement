import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Coins, 
  Calendar, 
  PlusCircle, 
  Trash2, 
  Edit3,
  ArrowUpRight,
  ShieldCheck,
  Target,
  AlertTriangle,
  PiggyBank,
  Landmark
} from 'lucide-react';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { InvestmentAsset, AssetPnL, InvestmentTransaction } from '../../types/investment';
import { 
  ASSET_CLASS_LABELS, 
  ASSET_CLASS_COLORS,
  getAssetClassLabel,
  formatHoldingPeriodText
} from '../../services/investmentCalculator';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface InvestmentDetailModalProps {
  asset: InvestmentAsset;
  onClose: () => void;
  onOpenAddTransaction: (assetId: string) => void;
  onOpenAddDividend?: (assetId: string) => void;
  onQuickUpdatePrice?: (asset: InvestmentAsset) => void;
}

export const InvestmentDetailModal: React.FC<InvestmentDetailModalProps> = ({
  asset,
  onClose,
  onOpenAddTransaction,
  onOpenAddDividend,
  onQuickUpdatePrice
}) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const { 
    getAssetPnL, 
    getAssetTransactions, 
    getAssetDividends, 
    deleteAsset, 
    deleteTransaction 
  } = useInvestmentStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'dividends'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pnl = getAssetPnL(asset.id);
  const transactions = getAssetTransactions(asset.id);
  const dividends = getAssetDividends(asset.id);

  if (!pnl) return null;

  const isProfitable = pnl.unrealizedPnL >= 0;
  const classColor = ASSET_CLASS_COLORS[asset.assetClass] || '#64748b';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleDelete = () => {
    deleteAsset(asset.id);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
              style={{ backgroundColor: classColor }}
            >
              {asset.symbol.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {asset.symbol}
                </h3>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${classColor}18`,
                    color: classColor
                  }}
                >
                  {getAssetClassLabel(asset.assetClass, t)}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-300 truncate max-w-[200px]">
                {asset.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onQuickUpdatePrice?.(asset)}
              title={asset.assetClass === 'savings' ? t('inv_card_edit_savings') : t('inv_card_edit_price')}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition"
            >
              <Edit3 size={15} />
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('inv_detail_tab_overview')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('inv_detail_tab_history')} ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('dividends')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'dividends'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('inv_detail_tab_dividends')} ({dividends.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {activeTab === 'overview' && (
            <div className="space-y-3.5">
              {asset.assetClass === 'savings' ? (
                <>
                  {/* Savings Principal & Maturity Total Card */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-300">
                        {t('inv_savings_deposit_principal')}
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                        {asset.termMonths || 0} {t('inv_term_month_unit')} • {asset.interestRate || 0}%/{t('inv_year_unit')}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(asset.avgBuyPrice)}
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                        {t('inv_savings_total_maturity')}
                      </span>
                      <div className="font-black text-base text-slate-900 dark:text-white">
                        {formatCurrency(asset.avgBuyPrice + (asset.expectedInterest || 0))}
                      </div>
                    </div>
                  </div>

                  {/* Savings Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                        {t('inv_savings_expected_interest')}
                      </span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        +{formatCurrency(asset.expectedInterest || 0)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                        {t('inv_savings_interest_rate')}: {asset.interestRate || 0}%
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                        {t('inv_savings_term_months')}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                        {asset.termMonths || 0} {t('inv_term_month_unit')}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                        {t('inv_savings_deposit_date')}: {asset.firstBuyDate || '-'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                        {t('inv_savings_maturity_date')}
                      </span>
                      <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                        {asset.maturityDate || '-'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                        {asset.termMonths || 0} {t('inv_term_month_unit')}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                        {t('inv_savings_interest_rate')}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                        {asset.interestRate || 0}% / {t('inv_year_unit')}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                        {t('inv_savings_interest_rate_hint')}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Market Value & Unrealized P&L Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-300">
                        {t('inv_detail_market_val')}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300">
                        {asset.quantity.toLocaleString('vi-VN')} {asset.currency} @ {formatCurrency(asset.currentPrice)}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(pnl.currentValue)}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                        {t('inv_detail_unrealized_pnl')}
                      </span>
                      <div className={`flex items-center gap-1 font-extrabold text-sm ${
                        isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isProfitable ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{isProfitable ? '+' : ''}{formatCurrency(pnl.unrealizedPnL)}</span>
                        <span>({isProfitable ? '+' : ''}{pnl.unrealizedPnLPercent.toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                        {t('inv_detail_avg_cost')}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                        {formatCurrency(asset.avgBuyPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                        {t('inv_detail_total_invested')} {formatCurrency(pnl.investedValue)}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                        {t('inv_detail_realized_pnl')}
                      </span>
                      <span className={`text-sm font-extrabold mt-0.5 block ${
                        pnl.realizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {pnl.realizedPnL >= 0 ? '+' : ''}{formatCurrency(pnl.realizedPnL)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                        {t('inv_detail_realized_desc')}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                        {t('inv_detail_dividends_collected')}
                      </span>
                      <span className="text-sm font-extrabold text-amber-500 dark:text-amber-400 mt-0.5 block">
                        +{formatCurrency(pnl.totalDividends)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                        YoC: {pnl.yieldOnCost}%
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                        {t('inv_detail_net_profit')}
                      </span>
                      <span className={`text-sm font-extrabold mt-0.5 block ${
                        pnl.allTimeNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {pnl.allTimeNetProfit >= 0 ? '+' : ''}{formatCurrency(pnl.allTimeNetProfit)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                        {t('inv_detail_net_profit_desc')}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Holding Period & Strategy Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Clock size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <span>{t('inv_detail_holding_time')}</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {pnl.holdingDays >= 30
                      ? `${formatHoldingPeriodText(pnl.holdingDays, t)} (${t('inv_holding_days', { days: pnl.holdingDays })})`
                      : formatHoldingPeriodText(pnl.holdingDays, t)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                  {t('inv_detail_first_buy_date')}: <span className="font-bold text-slate-700 dark:text-slate-200">{asset.firstBuyDate}</span>
                </div>

                {asset.notes && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 italic">
                    "{asset.notes}"
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                  {t('inv_detail_tab_history')}
                </span>
                <button
                  onClick={() => onOpenAddTransaction(asset.id)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                >
                  <PlusCircle size={14} />
                  <span>{t('inv_detail_add_tx')}</span>
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {t('inv_detail_history_empty')}
                </div>
              ) : (
                transactions.map(tx => (
                  <div 
                    key={tx.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          tx.type === 'buy'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}>
                          {asset.assetClass === 'savings'
                            ? (tx.type === 'buy' ? t('inv_savings_deposit_amount') : t('inv_savings_withdraw_btn'))
                            : (tx.type === 'buy' ? t('inv_detail_badge_buy') : t('inv_detail_badge_sell'))}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {asset.assetClass === 'savings'
                            ? formatCurrency(tx.totalAmount)
                            : `${tx.quantity.toLocaleString('vi-VN')} @ ${formatCurrency(tx.pricePerUnit)}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex flex-wrap items-center gap-2">
                        <span>{tx.date}</span>
                        {asset.assetClass === 'savings' && tx.termMonths && (
                          <span>• {tx.termMonths} {t('inv_term_month_unit')}</span>
                        )}
                        {asset.assetClass === 'savings' && tx.interestRate && (
                          <span>• {tx.interestRate}%/{t('inv_year_unit')}</span>
                        )}
                        {asset.assetClass === 'savings' && tx.expectedInterest && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">• +{formatCurrency(tx.expectedInterest)}</span>
                        )}
                        {tx.fees > 0 && <span>• {t('inv_detail_fee_label')}: {formatCurrency(tx.fees)}</span>}
                        {tx.notes && <span className="italic truncate max-w-[120px]">({tx.notes})</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(tx.totalAmount)}
                      </span>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        title={t('inv_detail_delete_tx')}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'dividends' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                  {t('inv_detail_tab_dividends')}
                </span>
                {onOpenAddDividend && (
                  <button
                    onClick={() => onOpenAddDividend(asset.id)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle size={14} />
                    <span>{t('inv_div_record_btn')}</span>
                  </button>
                )}
              </div>

              {dividends.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {t('inv_detail_dividends_empty')}
                </div>
              ) : (
                dividends.map(div => (
                  <div 
                    key={div.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          {div.type === 'cash' ? t('inv_detail_badge_cash') : t('inv_detail_badge_stock')}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {div.type === 'cash' ? `+${formatCurrency(div.amountOrQuantity)}` : `+${div.amountOrQuantity} ${t('inv_detail_unit_shares')}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
                        <span>{div.date}</span>
                        {div.taxDeducted && div.taxDeducted > 0 ? (
                          <span>{t('inv_div_tax_label') || t('inv_tx_tax')}: {formatCurrency(div.taxDeducted)}</span>
                        ) : null}
                        {div.notes && <span className="italic truncate max-w-[120px]">({div.notes})</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
          {!showDeleteConfirm ? (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-3 rounded-2xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                title={t('inv_detail_delete_asset')}
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => onOpenAddTransaction(asset.id)}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition"
              >
                <PlusCircle size={18} />
                <span>{t('inv_detail_add_tx_btn')}</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 gap-2">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                {t('inv_detail_confirm_delete')}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {t('inv_price_cancel') || t('cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white"
                >
                  {t('inv_detail_delete_permanent')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
