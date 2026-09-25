import React, { useState } from 'react';
import { 
  X, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Calendar, 
  Info,
  DollarSign
} from 'lucide-react';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { InvestmentAsset, AssetClass, TransactionType } from '../../types/investment';
import { 
  calculateNewDCAPrice, 
  calculateRealizedPnL, 
  ASSET_CLASS_LABELS 
} from '../../services/investmentCalculator';

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

  // Transaction details
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantityStr, setQuantityStr] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [feesStr, setFeesStr] = useState('0');
  const [taxStr, setTaxStr] = useState('0');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const numQuantity = parseFloat(quantityStr.replace(/,/g, '')) || 0;
  const numPrice = parseFloat(priceStr.replace(/,/g, '')) || 0;
  const numFees = parseFloat(feesStr.replace(/,/g, '')) || 0;
  const numTax = parseFloat(taxStr.replace(/,/g, '')) || 0;

  const totalAmount = (numQuantity * numPrice) + (txType === 'buy' ? numFees : -numFees - numTax);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Preview calculations
  let dcaPreview: { newQuantity: number; newAvgPrice: number } | null = null;
  let realizedPnLPreview = 0;

  if (selectedAsset && numQuantity > 0 && numPrice > 0) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (numQuantity <= 0) {
      setError('Vui lòng nhập số lượng hợp lệ lớn hơn 0');
      return;
    }
    if (numPrice <= 0) {
      setError('Vui lòng nhập đơn giá hợp lệ lớn hơn 0');
      return;
    }

    let targetAssetId = selectedAssetId;

    // Nếu người dùng chọn tạo mã tài sản mới
    if (isCreatingNewAsset) {
      if (!newSymbol.trim()) {
        setError('Vui lòng nhập mã Ticker (ví dụ: VNM, BTC, SJC...)');
        return;
      }
      if (!newName.trim()) {
        setError('Vui lòng nhập tên tài sản');
        return;
      }

      const createdAsset = addAsset({
        symbol: newSymbol.trim().toUpperCase(),
        name: newName.trim(),
        assetClass: newClass,
        quantity: 0, // Khởi tạo 0 để lệnh addTransaction ngay sau sẽ cộng đúng số lượng (tránh bị nhân đôi)
        avgBuyPrice: numPrice,
        currentPrice: numPrice,
        currency: newCurrency,
        firstBuyDate: date,
        notes: notes.trim() || undefined
      });
      targetAssetId = createdAsset.id;
    } else if (selectedAsset && txType === 'sell') {
      if (numQuantity > selectedAsset.quantity) {
        setError(`Không thể bán vượt quá số lượng đang sở hữu (${selectedAsset.quantity.toLocaleString('vi-VN')})`);
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
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Ghi nhận Giao dịch Mới
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-300">
              Nhập lệnh Mua tích sản hoặc Bán chốt lời/cắt lỗ
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Type Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setTxType('buy')}
            className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              txType === 'buy'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={16} />
            <span>Lệnh Mua (Buy / DCA)</span>
          </button>

          <button
            type="button"
            onClick={() => setTxType('sell')}
            className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              txType === 'sell'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingDown size={16} />
            <span>Lệnh Bán (Sell)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Asset Selection */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
              Chọn Tài sản
            </label>
            <select
              value={selectedAssetId}
              onChange={e => setSelectedAssetId(e.target.value)}
              className="w-full text-base px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.symbol} - {a.name} ({ASSET_CLASS_LABELS[a.assetClass]}) - Đang có: {a.quantity.toLocaleString('vi-VN')}
                </option>
              ))}
              <option value="new">+ Thêm mã đầu tư mới...</option>
            </select>
          </div>

          {/* New Asset Fields (if "+ Thêm mã mới" selected) */}
          {isCreatingNewAsset && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Mã Ticker (VNM, BTC...) *
                  </label>
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={e => setNewSymbol(e.target.value)}
                    placeholder="VD: HPG"
                    className="w-full text-base uppercase px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Loại tài sản *
                  </label>
                  <select
                    value={newClass}
                    onChange={e => setNewClass(e.target.value as AssetClass)}
                    className="w-full text-base px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="stock">Cổ phiếu</option>
                    <option value="crypto">Crypto</option>
                    <option value="gold">Vàng & KL quý</option>
                    <option value="savings">Tiết kiệm</option>
                    <option value="fund">Chứng chỉ quỹ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Tên đầy đủ của tài sản *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="VD: Tập đoàn Hòa Phát"
                  className="w-full text-base px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
              Ngày khớp lệnh
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-base px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>

          {/* Quantity and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
                Số lượng khớp
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={quantityStr}
                onChange={e => setQuantityStr(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="VD: 100 hoặc 0.05"
                className="w-full text-base px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
                Đơn giá (đ)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={priceStr}
                onChange={e => setPriceStr(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="VD: 32000"
                className="w-full text-base px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Fees and Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
                Phí giao dịch (đ)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={feesStr}
                onChange={e => setFeesStr(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className="w-full text-base px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
                Thuế TNCN (đ)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={taxStr}
                onChange={e => setTaxStr(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className="w-full text-base px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
              Ghi chú chiến lược (tùy chọn)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="VD: Mua gom vùng hỗ trợ, chốt lời 30%..."
              className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Live Preview Box */}
          {numQuantity > 0 && numPrice > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Tổng thanh toán:</span>
                <span className="font-black text-slate-900 dark:text-white text-sm">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {txType === 'buy' && dcaPreview && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                  <span>DCA mới ước tính:</span>
                  <span>{formatCurrency(dcaPreview.newAvgPrice)} / đơn vị</span>
                </div>
              )}

              {txType === 'sell' && selectedAsset && (
                <div className={`pt-2 border-t border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between font-bold ${
                  realizedPnLPreview >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  <span>Lãi/Lỗ chốt lần này:</span>
                  <span>{realizedPnLPreview >= 0 ? '+' : ''}{formatCurrency(realizedPnLPreview)}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-500 font-bold">{error}</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 rounded-2xl text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95 ${
                txType === 'buy' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25' 
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
              }`}
            >
              <Check size={18} />
              <span>Xác nhận {txType === 'buy' ? 'Mua' : 'Bán'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
