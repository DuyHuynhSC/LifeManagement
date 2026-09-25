import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Coins, 
  TrendingUp, 
  Layers, 
  Calculator, 
  DollarSign, 
  Calendar, 
  Info 
} from 'lucide-react';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { InvestmentAsset } from '../../types/investment';
import { 
  calculateStockDividendAdjustment, 
  ASSET_CLASS_LABELS,
  getAssetClassLabel
} from '../../services/investmentCalculator';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface AddDividendModalProps {
  initialAssetId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddDividendModal: React.FC<AddDividendModalProps> = ({
  initialAssetId,
  onClose,
  onSuccess
}) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const { assets, addDividend } = useInvestmentStore();

  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    initialAssetId || (assets.length > 0 ? assets[0].id : '')
  );
  const [divType, setDivType] = useState<'cash' | 'stock'>('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountStr, setAmountStr] = useState('');
  const [taxStr, setTaxStr] = useState('0');
  const [reinvested, setReinvested] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const numAmount = parseFloat(amountStr.replace(/,/g, '')) || 0;
  const numTax = parseFloat(taxStr.replace(/,/g, '')) || 0;
  const netReceived = Math.max(0, numAmount - numTax);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Preview stock dividend dilution if stock type
  let stockDilutionPreview: { newQuantity: number; newAvgPrice: number } | null = null;
  if (selectedAsset && divType === 'stock' && numAmount > 0) {
    stockDilutionPreview = calculateStockDividendAdjustment(
      selectedAsset.quantity,
      selectedAsset.avgBuyPrice,
      numAmount
    );
  }

  // Quick 5% tax helper for VN stocks
  const handleApply5PercentTax = () => {
    if (numAmount > 0) {
      const tax5 = Math.round(numAmount * 0.05);
      setTaxStr(tax5.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedAssetId) {
      setError(t('inv_div_require_asset'));
      return;
    }
    if (numAmount <= 0) {
      setError(t('inv_div_invalid_amount'));
      return;
    }

    addDividend({
      assetId: selectedAssetId,
      date,
      type: divType,
      amountOrQuantity: numAmount,
      taxDeducted: divType === 'cash' ? numTax : 0,
      reinvested,
      notes: notes.trim() || undefined
    });

    onSuccess?.();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Coins size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {t('inv_div_title')}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-300">
                {t('inv_div_subtitle')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dividend Type Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setDivType('cash')}
            className={`py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              divType === 'cash'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coins size={16} />
            <span>{t('inv_div_type_cash')}</span>
          </button>

          <button
            type="button"
            onClick={() => setDivType('stock')}
            className={`py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              divType === 'stock'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers size={16} />
            <span>{t('inv_div_type_stock')}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Select Asset */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
              {t('inv_div_select_asset')}
            </label>
            <select
              value={selectedAssetId}
              onChange={e => setSelectedAssetId(e.target.value)}
              className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
            >
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.symbol} - {a.name} ({getAssetClassLabel(a.assetClass, t)})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
              {t('inv_div_date_label')}
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
            />
          </div>

          {/* If Cash Dividend */}
          {divType === 'cash' ? (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  {t('inv_div_cash_amount_label')}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="VD: 1500000"
                  className="w-full h-10 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {t('inv_div_tax_label')}
                  </label>
                  <button
                    type="button"
                    onClick={handleApply5PercentTax}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    {t('inv_div_apply_tax_btn')}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={taxStr}
                  onChange={e => setTaxStr(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-full h-10 text-xs sm:text-sm font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Net Cash Preview */}
              {numAmount > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200">{t('inv_div_net_received')}:</span>
                  <span className="font-black text-amber-800 dark:text-amber-300 text-sm">
                    +{formatCurrency(netReceived)}
                  </span>
                </div>
              )}

              {/* Reinvestment (DRIP) checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reinvested}
                  onChange={e => setReinvested(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {t('inv_div_drip_label')}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                    {t('inv_div_drip_desc')}
                  </span>
                </div>
              </label>
            </>
          ) : (
            /* If Stock Dividend */
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  {t('inv_div_stock_amount_label')}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="VD: 200"
                  className="w-full h-10 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Live Preview of Diluted Average Price */}
              {stockDilutionPreview && selectedAsset && (
                <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{t('inv_div_new_qty_label')}:</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {selectedAsset.quantity.toLocaleString('vi-VN')} ➔ {stockDilutionPreview.newQuantity.toLocaleString('vi-VN')} CP
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-indigo-100 dark:border-indigo-900">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{t('inv_div_new_dca_label')}:</span>
                    <span className="font-black text-indigo-700 dark:text-indigo-300">
                      {formatCurrency(stockDilutionPreview.newAvgPrice)} / CP
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-300 font-medium italic mt-1">
                    {t('inv_div_dilution_note')}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
              {t('inv_div_notes_label')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('inv_div_notes_placeholder')}
              className="w-full h-10 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-bold">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {t('inv_div_cancel_btn')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5 transition"
            >
              <Check size={16} />
              <span>{t('inv_div_save_btn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
