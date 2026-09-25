import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  RotateCcw,
  Layers,
  TrendingUp,
  Sparkles,
  Coins,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { InvestmentHeroCard } from './InvestmentHeroCard';
import { AssetAllocationChart } from './AssetAllocationChart';
import { InvestmentAssetCard } from './InvestmentAssetCard';
import { QuickUpdatePriceModal } from './QuickUpdatePriceModal';
import { AddTransactionModal } from './AddTransactionModal';
import { InvestmentDetailModal } from './InvestmentDetailModal';
import { AddDividendModal } from './AddDividendModal';
import { DividendTrackerView } from './DividendTrackerView';
import { InvestmentAsset, AssetClass } from '../../types/investment';
import { ASSET_CLASS_LABELS } from '../../services/investmentCalculator';
import { syncAllMarketPrices } from '../../services/marketPriceService';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface InvestmentTabProps {
  onOpenAddTransaction?: (assetId?: string) => void;
  onOpenAddAsset?: () => void;
  onSelectAsset?: (asset: InvestmentAsset) => void;
}

export const InvestmentTab: React.FC<InvestmentTabProps> = ({
  onOpenAddTransaction,
  onOpenAddAsset,
  onSelectAsset
}) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const {
    assets,
    portfolioSummary,
    getAssetPnL,
    updateAssetPrice,
    resetToInitialData
  } = useInvestmentStore();

  const [selectedClass, setSelectedClass] = useState<AssetClass | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPriceAsset, setEditingPriceAsset] = useState<InvestmentAsset | null>(null);
  const [showAddTx, setShowAddTx] = useState(false);
  const [txAssetId, setTxAssetId] = useState<string | undefined>(undefined);
  const [detailAsset, setDetailAsset] = useState<InvestmentAsset | null>(null);

  // Sync market prices state
  const [isSyncingPrices, setIsSyncingPrices] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const handleSyncAllPrices = async () => {
    if (isSyncingPrices) return;
    setIsSyncingPrices(true);
    setSyncMessage(null);
    try {
      const { updatedCount, failedSymbols } = await syncAllMarketPrices(assets, updateAssetPrice);
      if (updatedCount > 0) {
        const failedPart = failedSymbols.length > 0 ? ` (${t('inv_sync_failed_symbols', { symbols: failedSymbols.join(', ') })})` : '';
        setSyncMessage({
          text: t('inv_sync_success', { count: updatedCount, failed: failedPart }),
          type: failedSymbols.length > 0 ? 'warning' : 'success'
        });
      } else if (failedSymbols.length > 0) {
        setSyncMessage({
          text: t('inv_sync_failed_symbols', { symbols: failedSymbols.join(', ') }),
          type: 'warning'
        });
      } else {
        setSyncMessage({
          text: t('inv_sync_no_assets'),
          type: 'warning'
        });
      }
    } catch {
      setSyncMessage({
        text: t('inv_sync_error_network'),
        type: 'warning'
      });
    } finally {
      setIsSyncingPrices(false);
      setTimeout(() => {
        setSyncMessage(null);
      }, 4500);
    }
  };

  // Giai đoạn 4: Tab switcher & Dividend modal state
  const [activeView, setActiveView] = useState<'holdings' | 'dividends'>('holdings');
  const [showAddDividend, setShowAddDividend] = useState(false);
  const [dividendAssetId, setDividendAssetId] = useState<string | undefined>(undefined);

  const handleOpenAddTx = (assetId?: string) => {
    setTxAssetId(assetId);
    setShowAddTx(true);
    onOpenAddTransaction?.(assetId);
  };

  const handleOpenAddDividend = (assetId?: string) => {
    setDividendAssetId(assetId);
    setShowAddDividend(true);
  };

  // Filter assets by category & search query
  const filteredAssets = assets.filter(asset => {
    const matchesClass = selectedClass === 'all' || asset.assetClass === selectedClass;
    const matchesSearch = asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const categories: { id: AssetClass | 'all'; label: string; count: number }[] = [
    { id: 'all', label: t('inv_class_all'), count: assets.length },
    { id: 'stock', label: t('inv_class_stock'), count: assets.filter(a => a.assetClass === 'stock').length },
    { id: 'crypto', label: t('inv_class_crypto'), count: assets.filter(a => a.assetClass === 'crypto').length },
    { id: 'gold', label: t('inv_class_gold'), count: assets.filter(a => a.assetClass === 'gold').length },
    { id: 'savings', label: t('inv_class_savings'), count: assets.filter(a => a.assetClass === 'savings').length },
    { id: 'fund', label: t('inv_class_fund'), count: assets.filter(a => a.assetClass === 'fund').length }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
      {/* Top Bar with Title & Actions */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
              {t('inv_title')}
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('inv_realtime_badge')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium mt-0.5 leading-snug line-clamp-2 sm:line-clamp-1">
            {t('inv_subtitle')}
          </p>
        </div>

        {/* Action Button: Thêm lệnh hoặc thêm mã */}
        <div className="shrink-0">
          {activeView === 'holdings' ? (
            <button
              onClick={() => handleOpenAddTx()}
              className="h-8 px-2.5 sm:px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition whitespace-nowrap flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>{t('inv_action_add_tx')}</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenAddDividend()}
              className="h-8 px-2.5 sm:px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition whitespace-nowrap flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>{t('inv_action_add_div')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-view Switcher: Vị thế Nắm giữ vs Cổ tức & Dòng tiền */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveView('holdings')}
          className={`h-9 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${activeView === 'holdings'
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-extrabold'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <Layers size={14} className="shrink-0" />
          <span className="truncate">{t('inv_holdings_tab')} ({assets.length})</span>
        </button>

        <button
          onClick={() => setActiveView('dividends')}
          className={`h-9 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${activeView === 'dividends'
            ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm font-extrabold'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <Coins size={14} className="shrink-0" />
          <span className="truncate">{t('inv_dividends_tab')}</span>
        </button>
      </div>

      {/* Sync Notification Banner */}
      {syncMessage && (
        <div className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2 border ${syncMessage.type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}>
          {syncMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <span className="flex-1 leading-snug">{syncMessage.text}</span>
        </div>
      )}

      {/* VIEW 1: VỊ THẾ NẮM GIỮ (HOLDINGS & P&L) */}
      {activeView === 'holdings' ? (
        <>
          {/* Hero Card: Net Worth, P&L, ROI, Dividends */}
          <InvestmentHeroCard
            summary={portfolioSummary}
            onOpenQuickUpdate={() => {
              if (assets.length > 0) {
                setEditingPriceAsset(assets[0]);
              }
            }}
            onOpenAddTransaction={() => handleOpenAddTx()}
            onSyncMarketPrices={handleSyncAllPrices}
            isSyncing={isSyncingPrices}
          />

          {/* Asset Allocation Chart */}
          <AssetAllocationChart summary={portfolioSummary} />

          {/* Filter and Search Bar */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('inv_search_placeholder')}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => {
                const isActive = selectedClass === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedClass(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                      }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                      }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Holdings List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {t('inv_holdings_list_title')} ({filteredAssets.length})
              </h2>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 text-center space-y-3 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">
                    {t('inv_empty_title')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-300 font-medium max-w-xs mx-auto mt-1">
                    {t('inv_empty_desc')}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAddTx()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-indigo-500/25 transition mx-auto"
                >
                  <Plus size={16} />
                  <span>{t('inv_empty_btn')}</span>
                </button>
              </div>
            ) : (
              filteredAssets.map(asset => {
                const pnl = getAssetPnL(asset.id);
                if (!pnl) return null;

                return (
                  <InvestmentAssetCard
                    key={asset.id}
                    asset={asset}
                    pnl={pnl}
                    onSelectAsset={(selected) => {
                      setDetailAsset(selected);
                      onSelectAsset?.(selected);
                    }}
                    onQuickUpdatePrice={setEditingPriceAsset}
                  />
                );
              })
            )}
          </div>
        </>
      ) : (
        /* VIEW 2: CỔ TỨC & DÒNG TIỀN THỤ ĐỘNG */
        <DividendTrackerView
          onOpenAddDividend={() => handleOpenAddDividend()}
          onSelectAsset={onSelectAsset}
        />
      )}

      {/* Quick Price Update Modal */}
      {editingPriceAsset && (
        <QuickUpdatePriceModal
          asset={editingPriceAsset}
          onClose={() => setEditingPriceAsset(null)}
          onSave={(assetId, newPrice) => {
            updateAssetPrice(assetId, newPrice);
          }}
          onAssetUpdated={(updated) => {
            if (detailAsset && detailAsset.id === updated.id) {
              setDetailAsset(updated);
            }
          }}
        />
      )}

      {/* Add Transaction Modal */}
      {showAddTx && (
        <AddTransactionModal
          initialAssetId={txAssetId}
          onClose={() => setShowAddTx(false)}
        />
      )}

      {/* Add Dividend Modal */}
      {showAddDividend && (
        <AddDividendModal
          initialAssetId={dividendAssetId}
          onClose={() => setShowAddDividend(false)}
        />
      )}

      {/* Investment Asset Detail Modal */}
      {detailAsset && (
        <InvestmentDetailModal
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
          onOpenAddTransaction={(assetId) => {
            handleOpenAddTx(assetId);
          }}
          onOpenAddDividend={(assetId) => {
            handleOpenAddDividend(assetId);
          }}
          onQuickUpdatePrice={(asset) => {
            setEditingPriceAsset(asset);
          }}
        />
      )}
    </div>
  );
};
