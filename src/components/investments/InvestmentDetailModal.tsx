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
  AlertTriangle
} from 'lucide-react';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { InvestmentAsset, AssetPnL, InvestmentTransaction } from '../../types/investment';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '../../services/investmentCalculator';

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
                  {ASSET_CLASS_LABELS[asset.assetClass]}
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
              title="Sửa giá thị trường"
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
            Tổng quan vị thế
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lịch sử lệnh ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('dividends')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'dividends'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cổ tức ({dividends.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {activeTab === 'overview' && (
            <div className="space-y-3.5">
              {/* Market Value & Unrealized P&L Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">
                    Giá trị thị trường hiện tại
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
                    Lãi/Lỗ chưa thực hiện:
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
                    Giá vốn trung bình (DCA)
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                    {formatCurrency(asset.avgBuyPrice)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                    Tổng vốn: {formatCurrency(pnl.investedValue)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                    Lãi/Lỗ đã chốt (Realized)
                  </span>
                  <span className={`text-sm font-extrabold mt-0.5 block ${
                    pnl.realizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {pnl.realizedPnL >= 0 ? '+' : ''}{formatCurrency(pnl.realizedPnL)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                    Từ các lệnh bán trước
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 block">
                    Cổ tức đã thu
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
                    Lãi ròng toàn bộ (Net)
                  </span>
                  <span className={`text-sm font-extrabold mt-0.5 block ${
                    pnl.allTimeNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {pnl.allTimeNetProfit >= 0 ? '+' : ''}{formatCurrency(pnl.allTimeNetProfit)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                    P&L + Chốt + Cổ tức
                  </span>
                </div>
              </div>

              {/* Holding Period & Strategy Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Clock size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Thời gian nắm giữ</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {pnl.holdingPeriodLabel} ({pnl.holdingDays} ngày)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                  Mở vị thế lần đầu vào ngày: <span className="font-bold text-slate-700 dark:text-slate-200">{asset.firstBuyDate}</span>
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
                  Lịch sử lệnh giao dịch
                </span>
                <button
                  onClick={() => onOpenAddTransaction(asset.id)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                >
                  <PlusCircle size={14} />
                  <span>Thêm lệnh</span>
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  Chưa có lịch sử lệnh nào cho mã này.
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
                          {tx.type === 'buy' ? 'MUA' : 'BÁN'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {tx.quantity.toLocaleString('vi-VN')} @ {formatCurrency(tx.pricePerUnit)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
                        <span>{tx.date}</span>
                        {tx.fees > 0 && <span>Phí: {formatCurrency(tx.fees)}</span>}
                        {tx.notes && <span className="italic truncate max-w-[120px]">({tx.notes})</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(tx.totalAmount)}
                      </span>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        title="Xóa lệnh"
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
                  Lịch sử Cổ tức & Lợi tức
                </span>
                {onOpenAddDividend && (
                  <button
                    onClick={() => onOpenAddDividend(asset.id)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle size={14} />
                    <span>Ghi nhận cổ tức</span>
                  </button>
                )}
              </div>

              {dividends.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  Chưa có lịch sử cổ tức cho tài sản này.
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
                          {div.type === 'cash' ? 'TIỀN MẶT' : 'CỔ PHIẾU'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {div.type === 'cash' ? `+${formatCurrency(div.amountOrQuantity)}` : `+${div.amountOrQuantity} CP`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
                        <span>{div.date}</span>
                        {div.taxDeducted && div.taxDeducted > 0 ? (
                          <span>Thuế: {formatCurrency(div.taxDeducted)}</span>
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
                title="Xóa mã này khỏi danh mục"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => onOpenAddTransaction(asset.id)}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition"
              >
                <PlusCircle size={18} />
                <span>Thêm lệnh Mua / Bán</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 gap-2">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Xác nhận xóa tài sản này?
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white"
                >
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
