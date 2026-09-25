import { useState, useEffect } from 'react';
import { 
  InvestmentAsset, 
  InvestmentTransaction, 
  DividendRecord, 
  PortfolioSummary,
  AssetPnL 
} from '../types/investment';
import { 
  initialInvestmentAssets, 
  initialInvestmentTransactions, 
  initialDividends 
} from '../data/initialInvestmentData';
import { 
  calculateAssetPnL, 
  calculatePortfolioSummary,
  calculateNewDCAPrice,
  calculateStockDividendAdjustment
} from '../services/investmentCalculator';

const INVESTMENT_STORAGE_KEY = 'famlife_investments_data_v2';

interface InvestmentStoreState {
  assets: InvestmentAsset[];
  transactions: InvestmentTransaction[];
  dividends: DividendRecord[];
}

function getStoredState(): InvestmentStoreState {
  try {
    const raw = localStorage.getItem(INVESTMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const assets: InvestmentAsset[] = Array.isArray(parsed.assets) ? parsed.assets : [];
      const transactions: InvestmentTransaction[] = Array.isArray(parsed.transactions) ? parsed.transactions : [];
      const dividends: DividendRecord[] = Array.isArray(parsed.dividends) ? parsed.dividends : [];

      // Tự động đối soát số lượng và giá vốn từ sổ lệnh (tránh bị lưu sai lệch)
      const reconciledAssets = assets.map(asset => {
        const assetTx = transactions
          .filter(t => t.assetId === asset.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (assetTx.length === 0) return asset;

        let totalQty = 0;
        let totalCost = 0;
        assetTx.forEach(tx => {
          if (tx.type === 'buy') {
            totalCost += (tx.quantity * tx.pricePerUnit) + (tx.fees || 0);
            totalQty += tx.quantity;
          } else if (tx.type === 'sell') {
            const avgCostBeforeSell = totalQty > 0 ? totalCost / totalQty : 0;
            totalCost = Math.max(0, totalCost - (tx.quantity * avgCostBeforeSell));
            totalQty = Math.max(0, totalQty - tx.quantity);
          }
        });

        dividends.filter(d => d.assetId === asset.id && d.type === 'stock').forEach(d => {
          totalQty += d.amountOrQuantity;
        });

        const avgBuyPrice = totalQty > 0 ? Math.round((totalCost / totalQty) * 100) / 100 : asset.avgBuyPrice;

        return { ...asset, quantity: totalQty, avgBuyPrice };
      });

      return {
        assets: reconciledAssets,
        transactions,
        dividends
      };
    }
  } catch (err) {
    console.error('Failed to parse investment stored state, using defaults', err);
  }
  return {
    assets: [],
    transactions: [],
    dividends: []
  };
}

let globalState = getStoredState();
const listeners = new Set<() => void>();

function notify() {
  localStorage.setItem(INVESTMENT_STORAGE_KEY, JSON.stringify(globalState));
  listeners.forEach(fn => fn());
}

export const useInvestmentStore = () => {
  const [state, setState] = useState<InvestmentStoreState>(globalState);

  useEffect(() => {
    const update = () => setState({ ...globalState });
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  // --- ACTIONS CHO TÀI SẢN ---
  const addAsset = (assetData: Omit<InvestmentAsset, 'id'>) => {
    const newAsset: InvestmentAsset = {
      ...assetData,
      id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    globalState = {
      ...globalState,
      assets: [newAsset, ...globalState.assets]
    };
    notify();
    return newAsset;
  };

  const updateAsset = (id: string, updates: Partial<InvestmentAsset>) => {
    globalState = {
      ...globalState,
      assets: globalState.assets.map(a => a.id === id ? { ...a, ...updates } : a)
    };
    notify();
  };

  const updateAssetPrice = (id: string, currentPrice: number) => {
    updateAsset(id, { currentPrice });
  };

  const deleteAsset = (id: string) => {
    globalState = {
      ...globalState,
      assets: globalState.assets.filter(a => a.id !== id),
      transactions: globalState.transactions.filter(t => t.assetId !== id),
      dividends: globalState.dividends.filter(d => d.assetId !== id)
    };
    notify();
  };

  // Helper tính toán lại số lượng và giá vốn trung bình từ sổ lệnh (tránh sai lệch hoặc nhân đôi)
  const recalculateAssetPosition = (assetId: string) => {
    const asset = globalState.assets.find(a => a.id === assetId);
    if (!asset) return;

    const assetTx = globalState.transactions
      .filter(t => t.assetId === assetId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const assetDivs = globalState.dividends.filter(d => d.assetId === assetId);

    // Nếu không có giao dịch nào, giữ nguyên hoặc reset nếu cần
    if (assetTx.length === 0 && assetDivs.length === 0) return;

    let totalQty = 0;
    let totalCost = 0;

    assetTx.forEach(tx => {
      if (tx.type === 'buy') {
        totalCost += (tx.quantity * tx.pricePerUnit) + (tx.fees || 0);
        totalQty += tx.quantity;
      } else if (tx.type === 'sell') {
        const avgCostBeforeSell = totalQty > 0 ? totalCost / totalQty : 0;
        totalCost = Math.max(0, totalCost - (tx.quantity * avgCostBeforeSell));
        totalQty = Math.max(0, totalQty - tx.quantity);
      }
    });

    // Cộng thêm cổ tức cổ phiếu nếu có
    assetDivs.filter(d => d.type === 'stock').forEach(d => {
      totalQty += d.amountOrQuantity;
    });

    const avgBuyPrice = totalQty > 0 ? Math.round((totalCost / totalQty) * 100) / 100 : asset.avgBuyPrice;

    globalState.assets = globalState.assets.map(a => 
      a.id === assetId ? { ...a, quantity: totalQty, avgBuyPrice } : a
    );
  };

  // --- ACTIONS CHO GIAO DỊCH (TRANSACTIONS) ---
  const addTransaction = (txData: Omit<InvestmentTransaction, 'id'>) => {
    const newTx: InvestmentTransaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    globalState = {
      ...globalState,
      transactions: [newTx, ...globalState.transactions]
    };

    // Tự động tính toán lại vị thế từ sổ lệnh
    recalculateAssetPosition(txData.assetId);

    notify();
    return newTx;
  };

  const deleteTransaction = (id: string) => {
    const tx = globalState.transactions.find(t => t.id === id);
    const assetId = tx ? tx.assetId : null;

    globalState = {
      ...globalState,
      transactions: globalState.transactions.filter(t => t.id !== id)
    };

    if (assetId) {
      recalculateAssetPosition(assetId);
    }

    notify();
  };

  // --- ACTIONS CHO CỔ TỨC (DIVIDENDS) ---
  const addDividend = (divData: Omit<DividendRecord, 'id'>) => {
    const newDiv: DividendRecord = {
      ...divData,
      id: `div-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    globalState = {
      ...globalState,
      dividends: [newDiv, ...globalState.dividends]
    };

    if (divData.type === 'stock') {
      recalculateAssetPosition(divData.assetId);
    }

    notify();
    return newDiv;
  };

  const deleteDividend = (id: string) => {
    const div = globalState.dividends.find(d => d.id === id);
    const assetId = div ? div.assetId : null;

    globalState = {
      ...globalState,
      dividends: globalState.dividends.filter(d => d.id !== id)
    };

    if (assetId && div?.type === 'stock') {
      recalculateAssetPosition(assetId);
    }

    notify();
  };

  const resetToInitialData = () => {
    globalState = {
      assets: initialInvestmentAssets,
      transactions: initialInvestmentTransactions,
      dividends: initialDividends
    };
    notify();
  };

  // --- DERIVED SELECTORS (TÍNH TOÁN THEO THỜI GIAN THỰC) ---
  const portfolioSummary: PortfolioSummary = calculatePortfolioSummary(
    state.assets,
    state.transactions,
    state.dividends
  );

  const getAssetPnL = (assetId: string): AssetPnL | null => {
    const asset = state.assets.find(a => a.id === assetId);
    if (!asset) return null;
    return calculateAssetPnL(asset, state.transactions, state.dividends);
  };

  const getAssetTransactions = (assetId: string) => {
    return state.transactions.filter(t => t.assetId === assetId);
  };

  const getAssetDividends = (assetId: string) => {
    return state.dividends.filter(d => d.assetId === assetId);
  };

  return {
    assets: state.assets,
    transactions: state.transactions,
    dividends: state.dividends,
    portfolioSummary,
    getAssetPnL,
    getAssetTransactions,
    getAssetDividends,
    addAsset,
    updateAsset,
    updateAssetPrice,
    deleteAsset,
    addTransaction,
    deleteTransaction,
    addDividend,
    deleteDividend,
    resetToInitialData,
    restoreInvestments: restoreInvestmentState,
    getExportData: getInvestmentExportData
  };
};

export function getInvestmentExportData(): {
  assets: InvestmentAsset[];
  transactions: InvestmentTransaction[];
  dividends: DividendRecord[];
} {
  return {
    assets: globalState.assets,
    transactions: globalState.transactions,
    dividends: globalState.dividends
  };
}

export function restoreInvestmentState(backup: {
  assets?: InvestmentAsset[];
  transactions?: InvestmentTransaction[];
  dividends?: DividendRecord[];
}): void {
  const assets: InvestmentAsset[] = Array.isArray(backup.assets) ? backup.assets : [];
  const transactions: InvestmentTransaction[] = Array.isArray(backup.transactions) ? backup.transactions : [];
  const dividends: DividendRecord[] = Array.isArray(backup.dividends) ? backup.dividends : [];

  // Tự động đối soát lại số lượng và giá vốn từ sổ lệnh
  const reconciledAssets = assets.map(asset => {
    const assetTx = transactions
      .filter(t => t.assetId === asset.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (assetTx.length === 0) return asset;

    let totalQty = 0;
    let totalCost = 0;
    assetTx.forEach(tx => {
      if (tx.type === 'buy') {
        totalCost += (tx.quantity * tx.pricePerUnit) + (tx.fees || 0);
        totalQty += tx.quantity;
      } else if (tx.type === 'sell') {
        const avgCostBeforeSell = totalQty > 0 ? totalCost / totalQty : 0;
        totalCost = Math.max(0, totalCost - (tx.quantity * avgCostBeforeSell));
        totalQty = Math.max(0, totalQty - tx.quantity);
      }
    });

    dividends.filter(d => d.assetId === asset.id && d.type === 'stock').forEach(d => {
      totalQty += d.amountOrQuantity;
    });

    const avgBuyPrice = totalQty > 0 ? Math.round((totalCost / totalQty) * 100) / 100 : asset.avgBuyPrice;

    return { ...asset, quantity: totalQty, avgBuyPrice };
  });

  globalState = {
    assets: reconciledAssets,
    transactions,
    dividends
  };
  notify();
}

