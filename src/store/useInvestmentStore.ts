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

const INVESTMENT_STORAGE_KEY = 'famlife_investments_data_v1';

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
      return {
        assets: parsed.assets?.length ? parsed.assets : initialInvestmentAssets,
        transactions: parsed.transactions?.length ? parsed.transactions : initialInvestmentTransactions,
        dividends: parsed.dividends?.length ? parsed.dividends : initialDividends
      };
    }
  } catch (err) {
    console.error('Failed to parse investment stored state, using defaults', err);
  }
  return {
    assets: initialInvestmentAssets,
    transactions: initialInvestmentTransactions,
    dividends: initialDividends
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

  // --- ACTIONS CHO GIAO DỊCH (TRANSACTIONS) ---
  const addTransaction = (txData: Omit<InvestmentTransaction, 'id'>) => {
    const newTx: InvestmentTransaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    // Tự động cập nhật vị thế số lượng và giá vốn trung bình (DCA) của tài sản
    const asset = globalState.assets.find(a => a.id === txData.assetId);
    if (asset) {
      if (txData.type === 'buy') {
        const { newQuantity, newAvgPrice } = calculateNewDCAPrice(
          asset.quantity,
          asset.avgBuyPrice,
          txData.quantity,
          txData.pricePerUnit,
          txData.fees
        );
        updateAsset(asset.id, {
          quantity: newQuantity,
          avgBuyPrice: newAvgPrice
        });
      } else if (txData.type === 'sell') {
        const updatedQty = Math.max(0, asset.quantity - txData.quantity);
        updateAsset(asset.id, { quantity: updatedQty });
      }
    }

    globalState = {
      ...globalState,
      transactions: [newTx, ...globalState.transactions]
    };
    notify();
    return newTx;
  };

  const deleteTransaction = (id: string) => {
    globalState = {
      ...globalState,
      transactions: globalState.transactions.filter(t => t.id !== id)
    };
    notify();
  };

  // --- ACTIONS CHO CỔ TỨC (DIVIDENDS) ---
  const addDividend = (divData: Omit<DividendRecord, 'id'>) => {
    const newDiv: DividendRecord = {
      ...divData,
      id: `div-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    // Nếu là cổ tức cổ phiếu (stock dividend): tự động tăng số lượng và điều chỉnh pha loãng giá vốn
    if (divData.type === 'stock') {
      const asset = globalState.assets.find(a => a.id === divData.assetId);
      if (asset) {
        const { newQuantity, newAvgPrice } = calculateStockDividendAdjustment(
          asset.quantity,
          asset.avgBuyPrice,
          divData.amountOrQuantity
        );
        updateAsset(asset.id, {
          quantity: newQuantity,
          avgBuyPrice: newAvgPrice
        });
      }
    }

    globalState = {
      ...globalState,
      dividends: [newDiv, ...globalState.dividends]
    };
    notify();
    return newDiv;
  };

  const deleteDividend = (id: string) => {
    globalState = {
      ...globalState,
      dividends: globalState.dividends.filter(d => d.id !== id)
    };
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
    resetToInitialData
  };
};
