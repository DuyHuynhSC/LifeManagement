import { 
  InvestmentAsset, 
  InvestmentTransaction, 
  DividendRecord, 
  AssetPnL, 
  PortfolioSummary,
  HoldingCategory,
  AssetClass
} from '../types/investment';

/**
 * Tính số ngày nắm giữ và định dạng chuỗi hiển thị trực quan
 */
export function calculateHoldingPeriod(
  firstBuyDateStr: string,
  targetDateStr?: string
): { days: number; label: string; category: HoldingCategory } {
  if (!firstBuyDateStr) {
    return { days: 0, label: '0 ngày', category: 'short_term' };
  }

  const startDate = new Date(firstBuyDateStr);
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();

  // Reset giờ phút để so sánh theo ngày
  startDate.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - startDate.getTime();
  const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  let category: HoldingCategory = 'short_term';
  if (days > 365) {
    category = 'long_term';
  } else if (days >= 90) {
    category = 'medium_term';
  }

  let label = `${days} ngày`;
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    const months = Math.floor(remainingDays / 30);
    label = months > 0 ? `${years} năm ${months} tháng` : `${years} năm`;
  } else if (days >= 30) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    label = remainingDays > 0 ? `${months} tháng ${remainingDays} ngày` : `${months} tháng`;
  }

  return { days, label, category };
}

/**
 * Tính lại giá vốn trung bình (DCA - Dollar Cost Averaging) khi thực hiện lệnh Mua mới
 */
export function calculateNewDCAPrice(
  currentQuantity: number,
  currentAvgPrice: number,
  newQuantity: number,
  newBuyPrice: number,
  fees: number = 0
): { newQuantity: number; newAvgPrice: number } {
  const safeCurrentQty = Math.max(0, currentQuantity);
  const totalQty = safeCurrentQty + newQuantity;

  if (totalQty <= 0) {
    return { newQuantity: 0, newAvgPrice: 0 };
  }

  const currentTotalCost = safeCurrentQty * currentAvgPrice;
  const newBuyCost = (newQuantity * newBuyPrice) + fees;
  const newAvgPrice = (currentTotalCost + newBuyCost) / totalQty;

  return {
    newQuantity: totalQty,
    newAvgPrice: Math.round(newAvgPrice * 100) / 100
  };
}

/**
 * Điều chỉnh số lượng và giá vốn trung bình khi nhận cổ tức bằng cổ phiếu / thưởng cổ phiếu (Stock Dividend)
 * Pha loãng giá kỹ thuật: Vốn đầu tư không đổi, số lượng cổ phiếu tăng lên
 */
export function calculateStockDividendAdjustment(
  currentQuantity: number,
  currentAvgPrice: number,
  bonusShares: number
): { newQuantity: number; newAvgPrice: number } {
  const newQuantity = currentQuantity + bonusShares;
  if (newQuantity <= 0) return { newQuantity: 0, newAvgPrice: 0 };

  const totalCost = currentQuantity * currentAvgPrice;
  const newAvgPrice = totalCost / newQuantity;

  return {
    newQuantity,
    newAvgPrice: Math.round(newAvgPrice * 100) / 100
  };
}

/**
 * Tính Lãi/Lỗ đã chốt (Realized P&L) cho một lệnh Bán (Sell)
 */
export function calculateRealizedPnL(
  sellQuantity: number,
  sellPrice: number,
  avgBuyPrice: number,
  fees: number = 0,
  tax: number = 0
): number {
  const grossProceeds = sellQuantity * sellPrice;
  const netProceeds = grossProceeds - fees - tax;
  const costBasis = sellQuantity * avgBuyPrice;
  return Math.round((netProceeds - costBasis) * 100) / 100;
}

/**
 * Tính toán chi tiết Lãi/Lỗ, Thời gian nắm giữ và Lợi nhuận cho 1 tài sản cụ thể
 */
export function calculateAssetPnL(
  asset: InvestmentAsset,
  transactions: InvestmentTransaction[] = [],
  dividends: DividendRecord[] = []
): AssetPnL {
  const investedValue = Math.max(0, asset.quantity * asset.avgBuyPrice);
  const currentValue = Math.max(0, asset.quantity * asset.currentPrice);
  const unrealizedPnL = currentValue - investedValue;
  const unrealizedPnLPercent = investedValue > 0 ? (unrealizedPnL / investedValue) * 100 : 0;

  // Tính Realized P&L từ các lệnh Bán của tài sản này
  const assetTransactions = transactions.filter(t => t.assetId === asset.id);
  const realizedPnL = assetTransactions
    .filter(t => t.type === 'sell')
    .reduce((sum, tx) => {
      // Giả sử giá vốn lúc bán xấp xỉ avgBuyPrice hiện tại hoặc được tính theo lot
      const txRealized = (tx.quantity * tx.pricePerUnit) - tx.fees - tx.tax - (tx.quantity * asset.avgBuyPrice);
      return sum + txRealized;
    }, 0);

  // Tính tổng cổ tức tiền mặt / tiền lãi đã nhận
  const assetDividends = dividends.filter(d => d.assetId === asset.id);
  const totalCashDividends = assetDividends
    .filter(d => d.type === 'cash')
    .reduce((sum, d) => sum + (d.amountOrQuantity - (d.taxDeducted || 0)), 0);

  // Tính tổng lãi ròng toàn bộ thời gian
  const allTimeNetProfit = unrealizedPnL + realizedPnL + totalCashDividends;

  // Tính thời gian nắm giữ
  const { days, label, category } = calculateHoldingPeriod(asset.firstBuyDate);

  // Tỷ suất cổ tức trên giá vốn (Yield on Cost)
  const yieldOnCost = investedValue > 0 ? (totalCashDividends / investedValue) * 100 : 0;

  return {
    investedValue: Math.round(investedValue),
    currentValue: Math.round(currentValue),
    unrealizedPnL: Math.round(unrealizedPnL),
    unrealizedPnLPercent: Math.round(unrealizedPnLPercent * 100) / 100,
    realizedPnL: Math.round(realizedPnL),
    totalDividends: Math.round(totalCashDividends),
    allTimeNetProfit: Math.round(allTimeNetProfit),
    holdingDays: days,
    holdingPeriodLabel: label,
    holdingCategory: category,
    yieldOnCost: Math.round(yieldOnCost * 100) / 100
  };
}

/**
 * Tên hiển thị tiếng Việt cho các nhóm tài sản
 */
export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  stock: 'Cổ phiếu',
  crypto: 'Tiền ảo (Crypto)',
  gold: 'Vàng & Kim loại quý',
  savings: 'Tiết kiệm & Trái phiếu',
  fund: 'Chứng chỉ quỹ',
  real_estate: 'Bất động sản',
  other: 'Khác'
};

/**
 * Màu sắc đại diện cho biểu đồ phân bổ
 */
export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  stock: '#3b82f6',     // Blue
  crypto: '#8b5cf6',    // Purple
  gold: '#f59e0b',      // Amber/Gold
  savings: '#10b981',   // Emerald
  fund: '#06b6d4',      // Cyan
  real_estate: '#ec4899', // Pink
  other: '#64748b'      // Slate
};

/**
 * Tính toán báo cáo Tổng quan Danh mục Đầu tư (Portfolio Summary)
 */
export function calculatePortfolioSummary(
  assets: InvestmentAsset[],
  transactions: InvestmentTransaction[] = [],
  dividends: DividendRecord[] = []
): PortfolioSummary {
  let totalInvested = 0;
  let currentMarketValue = 0;
  let totalWeightedHoldingDays = 0;

  const classValues: Partial<Record<AssetClass, number>> = {};

  assets.forEach(asset => {
    const pnl = calculateAssetPnL(asset, transactions, dividends);
    totalInvested += pnl.investedValue;
    currentMarketValue += pnl.currentValue;

    // Cộng dồn tỷ trọng phân bổ
    classValues[asset.assetClass] = (classValues[asset.assetClass] || 0) + pnl.currentValue;

    // Thời gian nắm giữ có trọng số vốn
    totalWeightedHoldingDays += pnl.holdingDays * pnl.investedValue;
  });

  const totalUnrealizedPnL = currentMarketValue - totalInvested;
  const unrealizedPnLPercent = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;

  // Tính tổng Realized P&L từ toàn bộ lịch sử bán
  const totalRealizedPnL = transactions
    .filter(t => t.type === 'sell')
    .reduce((sum, tx) => {
      const asset = assets.find(a => a.id === tx.assetId);
      const costPrice = asset ? asset.avgBuyPrice : tx.pricePerUnit;
      const profit = (tx.quantity * tx.pricePerUnit) - tx.fees - tx.tax - (tx.quantity * costPrice);
      return sum + profit;
    }, 0);

  // Tính tổng cổ tức đã thu
  const totalDividendsReceived = dividends
    .filter(d => d.type === 'cash')
    .reduce((sum, d) => sum + (d.amountOrQuantity - (d.taxDeducted || 0)), 0);

  const allTimeNetProfit = totalUnrealizedPnL + totalRealizedPnL + totalDividendsReceived;

  // ROI toàn bộ danh mục
  const roiPercentage = totalInvested > 0 
    ? ((totalUnrealizedPnL + totalRealizedPnL + totalDividendsReceived) / totalInvested) * 100 
    : 0;

  // Thời gian nắm giữ trung bình (ngày)
  const averageHoldingDays = totalInvested > 0 
    ? Math.round(totalWeightedHoldingDays / totalInvested) 
    : 0;

  // Cơ cấu phân bổ tài sản
  const allocationByClass = Object.entries(classValues).map(([assetClass, val]) => {
    const value = val || 0;
    const percentage = currentMarketValue > 0 ? Math.round((value / currentMarketValue) * 1000) / 10 : 0;
    return {
      assetClass: assetClass as AssetClass,
      label: ASSET_CLASS_LABELS[assetClass as AssetClass] || assetClass,
      value: Math.round(value),
      percentage
    };
  });

  return {
    totalInvested: Math.round(totalInvested),
    currentMarketValue: Math.round(currentMarketValue),
    totalUnrealizedPnL: Math.round(totalUnrealizedPnL),
    unrealizedPnLPercent: Math.round(unrealizedPnLPercent * 100) / 100,
    totalRealizedPnL: Math.round(totalRealizedPnL),
    totalDividendsReceived: Math.round(totalDividendsReceived),
    allTimeNetProfit: Math.round(allTimeNetProfit),
    roiPercentage: Math.round(roiPercentage * 100) / 100,
    averageHoldingDays,
    allocationByClass
  };
}

/**
 * Gom nhóm cổ tức theo tháng để vẽ biểu đồ dòng tiền thụ động (Monthly Dividend Cashflow)
 */
export function groupDividendsByMonth(
  dividends: DividendRecord[],
  yearFilter?: number
): { month: string; amount: number; count: number }[] {
  const currentYear = yearFilter || new Date().getFullYear();
  const monthsData: Record<number, { amount: number; count: number }> = {};

  for (let m = 1; m <= 12; m++) {
    monthsData[m] = { amount: 0, count: 0 };
  }

  dividends
    .filter(d => d.type === 'cash')
    .forEach(d => {
      const date = new Date(d.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth() + 1; // 1-12
        const netAmount = d.amountOrQuantity - (d.taxDeducted || 0);
        monthsData[month].amount += netAmount;
        monthsData[month].count += 1;
      }
    });

  return Object.entries(monthsData).map(([m, data]) => ({
    month: `T${m}`,
    amount: Math.round(data.amount),
    count: data.count
  }));
}
