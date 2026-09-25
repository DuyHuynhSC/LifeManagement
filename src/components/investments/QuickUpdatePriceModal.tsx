import React, { useState } from 'react';
import { 
  X, 
  Check, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  Calendar,
  Landmark,
  Edit3
} from 'lucide-react';
import { InvestmentAsset } from '../../types/investment';
import { fetchPriceForAsset } from '../../services/marketPriceService';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface QuickUpdatePriceModalProps {
  asset: InvestmentAsset;
  onClose: () => void;
  onSave?: (assetId: string, newPrice: number) => void;
  onAssetUpdated?: (asset: InvestmentAsset) => void;
}

export const QuickUpdatePriceModal: React.FC<QuickUpdatePriceModalProps> = ({
  asset,
  onClose,
  onSave,
  onAssetUpdated
}) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);
  const { updateAsset, updateAssetPrice } = useInvestmentStore();

  const isSavings = asset.assetClass === 'savings';

  // Standard asset state (stock, crypto, gold, etc.)
  const [priceInput, setPriceInput] = useState(asset.currentPrice.toString());
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [fetchNotice, setFetchNotice] = useState<string | null>(null);

  // Savings specific state
  const [name, setName] = useState(asset.name);
  const [symbol, setSymbol] = useState(asset.symbol);
  const [savingsAmountStr, setSavingsAmountStr] = useState(
    asset.avgBuyPrice > 0 ? String(asset.avgBuyPrice) : ''
  );
  const [savingsTermMonths, setSavingsTermMonths] = useState<number>(asset.termMonths || 6);
  const [savingsInterestRateStr, setSavingsInterestRateStr] = useState<string>(
    asset.interestRate !== undefined ? String(asset.interestRate) : '5.5'
  );
  const [depositDate, setDepositDate] = useState(
    asset.firstBuyDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(asset.notes || '');
  const [error, setError] = useState('');

  const canFetchOnline = asset.assetClass === 'stock' || asset.assetClass === 'crypto';

  // Calculations for standard asset
  const numPrice = parseFloat(priceInput.replace(/,/g, '')) || 0;
  const priceDiff = numPrice - asset.avgBuyPrice;
  const pnlPercent = asset.avgBuyPrice > 0 ? (priceDiff / asset.avgBuyPrice) * 100 : 0;

  // Safe calculations for savings asset
  const depositPrincipal = Math.max(0, parseFloat(savingsAmountStr.replace(/[^0-9.]/g, '')) || 0);
  const annualRate = Math.max(0, parseFloat(savingsInterestRateStr.replace(/[^0-9.]/g, '')) || 0);
  const termMonths = Math.max(1, savingsTermMonths || 1);
  const savingsExpectedInterest = Math.round((depositPrincipal * (annualRate / 100) * termMonths) / 12) || 0;
  const savingsTotalMaturity = depositPrincipal + savingsExpectedInterest;

  const calculateMaturityDate = (startDateStr: string, months: number) => {
    try {
      const parts = startDateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          d.setMonth(d.getMonth() + months);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dt = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${dt}`;
        }
      }
    } catch {
      // fallback
    }
    return '';
  };
  const savingsMaturityDate = calculateMaturityDate(depositDate, termMonths);

  const formatCurrency = (val: number) => {
    const safeVal = isNaN(val) || !isFinite(val) ? 0 : val;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(safeVal);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };

  const handleFetchOnline = async () => {
    setIsFetchingPrice(true);
    setFetchNotice(null);
    setError('');
    try {
      const livePrice = await fetchPriceForAsset(asset);
      if (livePrice && livePrice > 0) {
        setPriceInput(livePrice.toString());
        setFetchNotice(t('inv_price_updated_notice', { price: formatCurrency(livePrice) }));
      } else {
        setError(t('inv_price_not_found', { symbol: asset.symbol }));
      }
    } catch {
      setError(t('inv_price_network_error'));
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleSaveStandardPrice = () => {
    if (numPrice <= 0) {
      setError(t('inv_price_invalid_val'));
      return;
    }
    if (onSave) {
      onSave(asset.id, numPrice);
    } else {
      updateAssetPrice(asset.id, numPrice);
    }
    onClose();
  };

  const handleSaveSavings = () => {
    setError('');
    if (!name.trim()) {
      setError(t('inv_tx_require_name'));
      return;
    }
    if (!symbol.trim()) {
      setError(t('inv_tx_require_ticker'));
      return;
    }
    if (depositPrincipal <= 0) {
      setError(t('inv_tx_invalid_qty'));
      return;
    }
    if (termMonths <= 0) {
      setError(t('inv_savings_term_months'));
      return;
    }

    const updated = updateAsset(asset.id, {
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      avgBuyPrice: depositPrincipal,
      currentPrice: depositPrincipal,
      termMonths,
      interestRate: annualRate,
      firstBuyDate: depositDate,
      maturityDate: savingsMaturityDate,
      expectedInterest: savingsExpectedInterest,
      notes: notes.trim() || undefined
    });

    if (updated) {
      onAssetUpdated?.(updated);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
              isSavings 
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isSavings ? <PiggyBank size={20} /> : <RefreshCw size={18} />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isSavings ? t('inv_savings_edit_title') : t('inv_price_title')}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-300">
                {isSavings ? t('inv_savings_edit_subtitle') : `${asset.symbol} - ${asset.name}`}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* SAVINGS EDIT FORM (KỲ HẠN, LÃI SUẤT, TIỀN GỬI, NGÂN HÀNG, ĐÁO HẠN) */}
        {isSavings ? (
          <div className="space-y-3">
            {/* Tên ngân hàng & Mã sổ */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1 truncate">
                  {t('inv_savings_bank_name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={t('inv_savings_bank_placeholder')}
                  className="w-full h-10 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1 truncate">
                  {t('inv_savings_ticker_label')}
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={t('inv_savings_ticker_placeholder')}
                  className="w-full h-10 text-xs sm:text-sm uppercase font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Tiền gửi gốc */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                {t('inv_savings_deposit_amount')} (VND)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={savingsAmountStr ? Number(savingsAmountStr.replace(/[^0-9]/g, '')).toLocaleString('vi-VN') : ''}
                onChange={e => setSavingsAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={handleInputKeyDown}
                placeholder="50.000.000"
                className="w-full h-10 text-xs sm:text-sm font-black px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {/* Quick amount chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[10000000, 20000000, 50000000, 100000000, 200000000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSavingsAmountStr(String(amt))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      depositPrincipal === amt
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {(amt / 1000000).toLocaleString('vi-VN')} Tr
                  </button>
                ))}
              </div>
            </div>

            {/* Kỳ hạn gửi (tháng) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {t('inv_savings_term_months')}
                </label>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {savingsTermMonths} {t('inv_term_month_unit')}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                {[1, 3, 6, 9, 12, 24].map(months => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setSavingsTermMonths(months)}
                    className={`py-2 rounded-xl text-xs font-bold border text-center transition ${
                      savingsTermMonths === months
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {months}T
                  </button>
                ))}
              </div>
            </div>

            {/* Lãi suất năm (%/năm) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {t('inv_savings_interest_rate')}
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  %/năm
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={savingsInterestRateStr}
                  onChange={e => {
                    const raw = e.target.value.replace(/,/g, '.');
                    const cleaned = raw.replace(/[^0-9.]/g, '');
                    const parts = cleaned.split('.');
                    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
                    setSavingsInterestRateStr(sanitized);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="5.5"
                  className="w-full h-10 text-xs sm:text-sm font-bold px-3 py-2 pr-8 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              </div>
              {/* Quick rate chips below */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[4.5, 5.0, 5.5, 6.0, 6.5, 7.0].map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSavingsInterestRateStr(rate.toFixed(1))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      annualRate === rate
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {rate.toFixed(1)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Ngày bắt đầu gửi */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                {t('inv_savings_deposit_date')}
              </label>
              <input
                type="date"
                value={depositDate}
                onChange={e => setDepositDate(e.target.value)}
                className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            {/* Live calculation preview for savings */}
            {depositPrincipal > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-900/60 border border-indigo-200 dark:border-indigo-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {t('inv_savings_maturity_date')}:
                  </span>
                  <span className="font-black text-indigo-700 dark:text-indigo-300">
                    {savingsMaturityDate || '-'} ({savingsTermMonths} {t('inv_term_month_unit')})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {t('inv_savings_expected_interest')}:
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    +{formatCurrency(savingsExpectedInterest)}
                  </span>
                </div>

                <div className="pt-2 border-t border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {t('inv_savings_total_maturity')}:
                  </span>
                  <span className="font-black text-base text-slate-900 dark:text-white">
                    {formatCurrency(savingsTotalMaturity)}
                  </span>
                </div>
              </div>
            )}

            {/* Ghi chú */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                {t('inv_tx_notes_label')}
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={t('inv_tx_notes_placeholder')}
                className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-bold">{error}</p>
            )}

            {/* Action buttons for savings */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {t('inv_price_cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveSavings}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition"
              >
                <Check size={16} />
                <span>{t('inv_savings_edit_save')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD ASSET EDIT (STOCK, CRYPTO, GOLD, ETC. - MARKET PRICE UPDATE) */
          <div className="space-y-4">
            {/* Current State Info */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                  {t('inv_price_current_avg')}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {formatCurrency(asset.avgBuyPrice)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                  {t('inv_price_current_qty')}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {asset.quantity.toLocaleString('vi-VN')} {asset.currency}
                </span>
              </div>
            </div>

            {/* New Price Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                  {t('inv_price_new_label')} ({asset.currency})
                </label>
                {canFetchOnline && (
                  <button
                    type="button"
                    onClick={handleFetchOnline}
                    disabled={isFetchingPrice}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 active:scale-95 transition disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={isFetchingPrice ? 'animate-spin' : ''} />
                    <span>{isFetchingPrice ? t('inv_syncing') : t('inv_action_sync_online')}</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceInput}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setPriceInput(val);
                    setError('');
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder={t('inv_price_placeholder')}
                  autoFocus
                  className="w-full h-10 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
              </div>
              {fetchNotice && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  ✓ {fetchNotice}
                </p>
              )}
              {error && (
                <p className="text-xs text-rose-500 font-bold mt-1">{error}</p>
              )}
            </div>

            {/* Realtime P&L Preview with this new price */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              priceDiff >= 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300'
            }`}>
              <div className="flex items-center gap-1.5">
                {priceDiff >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="text-xs font-bold">{t('inv_price_expected_pnl')}:</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold block">
                  {priceDiff >= 0 ? '+' : ''}{formatCurrency(priceDiff * asset.quantity)}
                </span>
                <span className="text-[10px] font-bold block">
                  ({priceDiff >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Save button for standard asset */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {t('inv_price_cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveStandardPrice}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition"
              >
                <Check size={16} />
                <span>{t('inv_price_save')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
