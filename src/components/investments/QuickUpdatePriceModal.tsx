import React, { useState } from 'react';
import { X, Check, RefreshCw, DollarSign, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { InvestmentAsset } from '../../types/investment';
import { fetchPriceForAsset } from '../../services/marketPriceService';

interface QuickUpdatePriceModalProps {
  asset: InvestmentAsset;
  onClose: () => void;
  onSave: (assetId: string, newPrice: number) => void;
}

export const QuickUpdatePriceModal: React.FC<QuickUpdatePriceModalProps> = ({
  asset,
  onClose,
  onSave
}) => {
  const [priceInput, setPriceInput] = useState(asset.currentPrice.toString());
  const [error, setError] = useState('');
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [fetchNotice, setFetchNotice] = useState<string | null>(null);

  const canFetchOnline = asset.assetClass === 'stock' || asset.assetClass === 'crypto';

  const numPrice = parseFloat(priceInput.replace(/,/g, '')) || 0;
  const priceDiff = numPrice - asset.avgBuyPrice;
  const pnlPercent = asset.avgBuyPrice > 0 ? (priceDiff / asset.avgBuyPrice) * 100 : 0;

  const handleFetchOnline = async () => {
    setIsFetchingPrice(true);
    setFetchNotice(null);
    setError('');
    try {
      const livePrice = await fetchPriceForAsset(asset);
      if (livePrice && livePrice > 0) {
        setPriceInput(livePrice.toString());
        setFetchNotice(`Đã cập nhật giá mới: ${formatCurrency(livePrice)}`);
      } else {
        setError(`Không tìm thấy giá trực tuyến cho mã ${asset.symbol}`);
      }
    } catch {
      setError('Lỗi khi kết nối lấy giá trực tuyến');
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal dots
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setPriceInput(val);
    setError('');
  };

  const handleSave = () => {
    if (numPrice <= 0) {
      setError('Vui lòng nhập giá thị trường hợp lệ lớn hơn 0');
      return;
    }
    onSave(asset.id, numPrice);
    onClose();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <RefreshCw size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Cập nhật giá thị trường
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-300">
                {asset.symbol} - {asset.name}
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

        {/* Current State Info */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
              Giá vốn trung bình (DCA)
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatCurrency(asset.avgBuyPrice)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
              Số lượng sở hữu
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
              Giá thị trường mới nhất ({asset.currency})
            </label>
            {canFetchOnline && (
              <button
                type="button"
                onClick={handleFetchOnline}
                disabled={isFetchingPrice}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 active:scale-95 transition disabled:opacity-50"
              >
                <RefreshCw size={11} className={isFetchingPrice ? 'animate-spin' : ''} />
                <span>{isFetchingPrice ? 'Đang tải...' : 'Lấy giá online'}</span>
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={handleInputChange}
              placeholder="Nhập giá mới..."
              autoFocus
              className="w-full text-base sm:text-lg font-bold px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
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
            <span className="text-xs font-bold">Lãi/Lỗ dự kiến:</span>
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

        {/* Save button */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition"
          >
            <Check size={18} />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
