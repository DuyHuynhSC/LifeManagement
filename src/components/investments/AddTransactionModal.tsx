import React, { useState } from 'react';
import { 
  X, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  PiggyBank,
  Landmark
} from 'lucide-react';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { InvestmentAsset, AssetClass } from '../../types/investment';
import { 
  calculateNewDCAPrice, 
  calculateRealizedPnL, 
  getAssetClassLabel
} from '../../services/investmentCalculator';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface AddTransactionModalProps {
  initialAssetId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  initialAssetId,
  onClose,
  onSuccess
}) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const { assets, addTransaction, addAsset } = useInvestmentStore();

  const [txType, setTxType] = useState<'buy' | 'sell'>('buy');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    initialAssetId || (assets.length > 0 ? assets[0].id : 'new')
  );

  // Form for creating a new asset on the fly
  const isCreatingNewAsset = selectedAssetId === 'new';
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState<AssetClass>('stock');
  const [newCurrency, setNewCurrency] = useState<'VND' | 'USD'>('VND');

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const isSavings = isCreatingNewAsset 
    ? newClass === 'savings' 
    : selectedAsset?.assetClass === 'savings';

  // Transaction details (standard assets)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantityStr, setQuantityStr] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [feesStr, setFeesStr] = useState('0');
  const [taxStr, setTaxStr] = useState('0');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Savings specific details
  const [savingsAmountStr, setSavingsAmountStr] = useState('');
  const [savingsTermMonths, setSavingsTermMonths] = useState<number>(6);
  const [savingsInterestRateStr, setSavingsInterestRateStr] = useState<string>('5.5');

  const numQuantity = Math.max(0, parseFloat(quantityStr.replace(/,/g, '')) || 0);
  const numPrice = Math.max(0, parseFloat(priceStr.replace(/,/g, '')) || 0);
  const numFees = Math.max(0, parseFloat(feesStr.replace(/,/g, '')) || 0);
  const numTax = Math.max(0, parseFloat(taxStr.replace(/,/g, '')) || 0);

  // Savings calculations (defensive & safe against NaN)
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
  const savingsMaturityDate = calculateMaturityDate(date, termMonths);

  const totalAmount = isSavings
    ? depositPrincipal
    : (numQuantity * numPrice) + (txType === 'buy' ? numFees : -numFees - numTax);

  const formatCurrency = (val: number) => {
    const safeVal = isNaN(val) || !isFinite(val) ? 0 : val;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(safeVal);
  };

  // Preview calculations for non-savings
  let dcaPreview: { newQuantity: number; newAvgPrice: number } | null = null;
  let realizedPnLPreview = 0;

  if (!isSavings && selectedAsset && numQuantity > 0 && numPrice > 0) {
    if (txType === 'buy') {
      dcaPreview = calculateNewDCAPrice(
        selectedAsset.quantity,
        selectedAsset.avgBuyPrice,
        numQuantity,
        numPrice,
        numFees
      );
    } else {
      realizedPnLPreview = calculateRealizedPnL(
        numQuantity,
        numPrice,
        selectedAsset.avgBuyPrice,
        numFees,
        numTax
      );
    }
  }

  // Prevent keyboard Enter key from submitting form or refreshing page
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setError('');

    try {
      // Handle savings submit
      if (isSavings) {
        if (depositPrincipal <= 0) {
          setError(t('inv_tx_invalid_qty'));
          return;
        }
        if (termMonths <= 0) {
          setError(t('inv_savings_term_months'));
          return;
        }

        let targetAssetId = selectedAssetId;

        if (isCreatingNewAsset) {
          const symbolToUse = newSymbol.trim().toUpperCase() || `SAV-${termMonths}M`;
          const nameToUse = newName.trim() || `${t('inv_class_savings')} ${termMonths} ${t('inv_term_month_unit')}`;

          const createdAsset = addAsset({
            symbol: symbolToUse,
            name: nameToUse,
            assetClass: 'savings',
            quantity: 0,
            avgBuyPrice: depositPrincipal,
            currentPrice: depositPrincipal,
            currency: 'VND',
            firstBuyDate: date,
            interestRate: annualRate,
            termMonths: termMonths,
            maturityDate: savingsMaturityDate,
            expectedInterest: savingsExpectedInterest,
            notes: notes.trim() || undefined
          });
          targetAssetId = createdAsset.id;
        } else if (selectedAsset && txType === 'sell') {
          if (selectedAsset.quantity <= 0) {
            setError(t('inv_tx_sell_exceed', { quantity: '0' }));
            return;
          }
        }

        addTransaction({
          assetId: targetAssetId,
          type: txType,
          date,
          quantity: 1,
          pricePerUnit: depositPrincipal,
          fees: 0,
          tax: 0,
          totalAmount: depositPrincipal,
          interestRate: annualRate,
          termMonths: termMonths,
          maturityDate: savingsMaturityDate,
          expectedInterest: savingsExpectedInterest,
          notes: notes.trim() || undefined
        });

        onSuccess?.();
        onClose();
        return;
      }

      // Standard Asset Submit
      if (numQuantity <= 0) {
        setError(t('inv_tx_invalid_qty'));
        return;
      }
      if (numPrice <= 0) {
        setError(t('inv_tx_invalid_price'));
        return;
      }

      let targetAssetId = selectedAssetId;

      if (isCreatingNewAsset) {
        if (!newSymbol.trim()) {
          setError(t('inv_tx_require_ticker'));
          return;
        }
        if (!newName.trim()) {
          setError(t('inv_tx_require_name'));
          return;
        }

        const createdAsset = addAsset({
          symbol: newSymbol.trim().toUpperCase(),
          name: newName.trim(),
          assetClass: newClass,
          quantity: 0,
          avgBuyPrice: numPrice,
          currentPrice: numPrice,
          currency: newCurrency,
          firstBuyDate: date,
          notes: notes.trim() || undefined
        });
        targetAssetId = createdAsset.id;
      } else if (selectedAsset && txType === 'sell') {
        if (numQuantity > selectedAsset.quantity) {
          setError(t('inv_tx_sell_exceed', { quantity: selectedAsset.quantity.toLocaleString('vi-VN') }));
          return;
        }
      }

      addTransaction({
        assetId: targetAssetId,
        type: txType,
        date,
        quantity: numQuantity,
        pricePerUnit: numPrice,
        fees: numFees,
        tax: numTax,
        totalAmount,
        notes: notes.trim() || undefined
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu giao dịch');
    }
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
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {isSavings && <PiggyBank size={20} className="text-amber-500" />}
              <span>{isSavings ? t('inv_class_savings') : t('inv_tx_title')}</span>
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-300">
              {isSavings ? t('inv_savings_interest_rate_hint') : t('inv_tx_subtitle')}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Type Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setTxType('buy')}
            className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              txType === 'buy'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isSavings ? <Landmark size={15} /> : <TrendingUp size={15} />}
            <span className="whitespace-nowrap">
              {isSavings ? t('inv_savings_deposit_amount') : t('inv_tx_buy_btn')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTxType('sell')}
            className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              txType === 'sell'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isSavings ? <PiggyBank size={15} /> : <TrendingDown size={15} />}
            <span className="whitespace-nowrap">
              {isSavings ? t('inv_savings_withdraw_btn') : t('inv_tx_sell_btn')}
            </span>
          </button>
        </div>

        {/* Modal Form Content - Using div instead of form to avoid native page reload on Android keyboards */}
        <div className="space-y-3">
          {/* Asset Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
              {t('inv_tx_select_asset')}
            </label>
            <select
              value={selectedAssetId}
              onChange={e => setSelectedAssetId(e.target.value)}
              className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.symbol} - {a.name} ({getAssetClassLabel(a.assetClass, t)})
                </option>
              ))}
              <option value="new">{t('inv_tx_create_new_opt')}</option>
            </select>
          </div>

          {/* New Asset Fields (if "+ Thêm mã mới" selected) */}
          {isCreatingNewAsset && (
            <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5 items-start">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    {isSavings ? t('inv_savings_ticker_label') : t('inv_tx_ticker_label')}
                  </label>
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={e => setNewSymbol(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={isSavings ? t('inv_savings_ticker_placeholder') : t('inv_tx_ticker_placeholder')}
                    className="w-full h-10 text-xs sm:text-sm uppercase px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    {t('inv_tx_asset_class_label')}
                  </label>
                  <select
                    value={newClass}
                    onChange={e => setNewClass(e.target.value as AssetClass)}
                    className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="stock">{t('inv_class_stock')}</option>
                    <option value="crypto">{t('inv_class_crypto')}</option>
                    <option value="gold">{t('inv_class_gold')}</option>
                    <option value="savings">{t('inv_class_savings')}</option>
                    <option value="fund">{t('inv_class_fund')}</option>
                    <option value="other">{t('inv_class_other')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  {isSavings ? t('inv_savings_bank_name') : t('inv_tx_asset_name_label')}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={isSavings ? t('inv_savings_bank_placeholder') : t('inv_tx_asset_name_placeholder')}
                  className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
              {isSavings ? t('inv_savings_deposit_date') : t('inv_tx_date_label')}
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>

          {/* SAVINGS SPECIFIC INPUTS */}
          {isSavings ? (
            <div className="space-y-3 pt-1">
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
                          ? 'bg-indigo-600 text-white border-indigo-600'
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
                      // Support both comma and dot for decimal typing on all keyboards
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
                {/* Quick rate chips positioned comfortably below input */}
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

              {/* Live Preview Box for Savings */}
              {depositPrincipal > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-900/60 border border-indigo-200 dark:border-indigo-800/80 space-y-2.5">
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
            </div>
          ) : (
            /* STANDARD ASSET INPUTS (STOCK, CRYPTO, GOLD, ETC.) */
            <>
              {/* Quantity and Price */}
              <div className="grid grid-cols-2 gap-2.5 items-start">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1 truncate">
                    {t('inv_tx_qty_label')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={quantityStr}
                    onChange={e => setQuantityStr(e.target.value.replace(/[^0-9.]/g, ''))}
                    onKeyDown={handleInputKeyDown}
                    placeholder={t('inv_tx_qty_placeholder')}
                    className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1 truncate">
                    {t('inv_tx_price_label')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={priceStr}
                    onChange={e => setPriceStr(e.target.value.replace(/[^0-9.]/g, ''))}
                    onKeyDown={handleInputKeyDown}
                    placeholder={t('inv_tx_price_placeholder')}
                    className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Fees and Tax */}
              <div className="grid grid-cols-2 gap-2.5 items-start">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1 truncate">
                    {t('inv_tx_fee_label')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={feesStr}
                    onChange={e => setFeesStr(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={handleInputKeyDown}
                    placeholder="0"
                    className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1 truncate">
                    {t('inv_tx_tax_label')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={taxStr}
                    onChange={e => setTaxStr(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={handleInputKeyDown}
                    placeholder="0"
                    className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Live Preview Box for Standard Asset */}
              {numQuantity > 0 && numPrice > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500 dark:text-slate-300">{t('inv_tx_total_amount')}:</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>

                  {txType === 'buy' && dcaPreview && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                      <span>{t('inv_tx_new_dca_preview')}:</span>
                      <span>{formatCurrency(dcaPreview.newAvgPrice)} / đơn vị</span>
                    </div>
                  )}

                  {txType === 'sell' && selectedAsset && (
                    <div className={`pt-2 border-t border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between font-bold ${
                      realizedPnLPreview >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      <span>{t('inv_tx_realized_preview')}:</span>
                      <span>{realizedPnLPreview >= 0 ? '+' : ''}{formatCurrency(realizedPnLPreview)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Notes */}
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

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {t('inv_tx_cancel_btn')}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className={`flex-1 py-2.5 rounded-xl text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 ${
                txType === 'buy' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25' 
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
              }`}
            >
              <Check size={16} />
              <span>
                {isSavings
                  ? (txType === 'buy' ? t('inv_savings_confirm_btn') : t('inv_savings_withdraw_btn'))
                  : (txType === 'buy' ? t('inv_tx_confirm_buy') : t('inv_tx_confirm_sell'))}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
