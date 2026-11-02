import { 
  InvestmentAsset, 
  InvestmentTransaction, 
  PortfolioSummary 
} from '../types/investment';
import { AIInsight } from '../types';

export interface PortfolioHealthAssessment {
  score: number; // 0 - 100
  rating: 'excellent' | 'good' | 'moderate' | 'needs_rebalance';
  label: string;
  badgeColor: string;
  insights: AIInsight[];
}

/**
 * Phân tích danh mục đầu tư thông minh và đề xuất các hành động tối ưu
 */
export function generatePortfolioInsights(
  assets: InvestmentAsset[] = [],
  portfolioSummary?: PortfolioSummary,
  _transactions: InvestmentTransaction[] = []
): { insights: AIInsight[]; health: PortfolioHealthAssessment } {
  const insights: AIInsight[] = [];
  let score = 100;
  const deductions: string[] = [];

  // Trường hợp chưa có tài sản đầu tư nào
  if (!assets || assets.length === 0) {
    insights.push({
      id: 'inv-no-assets',
      type: 'tip',
      category: 'investment',
      priority: 'medium',
      title: 'Bắt đầu tích lũy tài sản đầu tư',
      message: 'Bạn chưa có khoản đầu tư nào trong danh mục. Hãy thử ghi nhận khoản Tiết kiệm, Vàng hoặc Chứng chỉ quỹ (CCQ) đầu tiên để FamLife hỗ trợ quản lý tài sản và tối ưu lợi nhuận dài hạn.',
      actionText: 'Tạo tài sản đầu tư',
      targetTab: 'investments'
    });

    return {
      insights,
      health: {
        score: 50,
        rating: 'moderate',
        label: 'Chưa khởi tạo danh mục',
        badgeColor: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
        insights
      }
    };
  }

  const totalMarketValue = portfolioSummary?.currentMarketValue || 
    assets.reduce((sum, a) => sum + (Math.max(0, a.quantity) * (a.currentPrice || a.avgBuyPrice || 0)), 0);

  // Tính tỷ trọng theo từng nhóm tài sản (Asset Class)
  let stockVal = 0;
  let fundVal = 0;
  let savingsVal = 0;
  let goldVal = 0;
  let cryptoVal = 0;
  let realEstateVal = 0;

  assets.forEach(a => {
    const val = Math.max(0, a.quantity) * (a.currentPrice || a.avgBuyPrice || 0);
    switch (a.assetClass) {
      case 'stock': stockVal += val; break;
      case 'fund': fundVal += val; break;
      case 'savings': savingsVal += val; break;
      case 'gold': goldVal += val; break;
      case 'crypto': cryptoVal += val; break;
      case 'real_estate': realEstateVal += val; break;
      default: break;
    }
  });

  const stockPercent = totalMarketValue > 0 ? (stockVal / totalMarketValue) * 100 : 0;
  const fundPercent = totalMarketValue > 0 ? (fundVal / totalMarketValue) * 100 : 0;
  const savingsPercent = totalMarketValue > 0 ? (savingsVal / totalMarketValue) * 100 : 0;
  const goldPercent = totalMarketValue > 0 ? (goldVal / totalMarketValue) * 100 : 0;
  const cryptoPercent = totalMarketValue > 0 ? (cryptoVal / totalMarketValue) * 100 : 0;
  const safetyPercent = savingsPercent + goldPercent;

  // 1. Phân tích lớp đệm an toàn & thanh khoản (Tiết kiệm, Vàng)
  if (totalMarketValue >= 5000000 && safetyPercent < 15) {
    score -= 20;
    deductions.push('Lớp đệm an toàn thấp');
    insights.push({
      id: 'inv-safety-low',
      type: 'warning',
      category: 'investment',
      priority: 'high',
      title: 'Thiếu lớp đệm tài sản an toàn',
      message: `Tài sản phòng vệ (Tiết kiệm/Vàng) chỉ chiếm ${safetyPercent.toFixed(1)}% danh mục. Tỷ lệ an toàn được khuyến nghị từ 15-30% để đảm bảo thanh khoản dự phòng khi thị trường biến động hoặc có việc khẩn cấp.`,
      metric: `${safetyPercent.toFixed(0)}% phòng vệ`,
      actionText: 'Thêm Tiết kiệm / Vàng',
      targetTab: 'investments'
    });
  }

  // 2. Phân tích Cổ phiếu & Chứng chỉ quỹ (CCQ/ETF)
  if (stockPercent >= 65 && fundPercent === 0) {
    score -= 15;
    deductions.push('Thiếu CCQ cân bằng');
    insights.push({
      id: 'inv-stock-high-no-fund',
      type: 'tip',
      category: 'investment',
      priority: 'high',
      title: 'Tỷ trọng Cổ phiếu cao, thiếu CCQ cân bằng',
      message: `Cổ phiếu riêng lẻ đang chiếm ${stockPercent.toFixed(1)}% danh mục trong khi chưa có Chứng chỉ quỹ (CCQ/ETF). Việc bổ sung CCQ mở (như VN30, DCDS, VEOF...) giúp phân tán rủi ro tốt hơn 30-40% so với tự chọn cổ phiếu lẻ.`,
      metric: `${stockPercent.toFixed(0)}% Cổ phiếu`,
      actionText: 'Khám phá thêm CCQ',
      targetTab: 'investments'
    });
  } else if (fundPercent >= 20 && stockPercent <= 50 && stockVal > 0) {
    insights.push({
      id: 'inv-core-satellite',
      type: 'tip',
      category: 'investment',
      priority: 'low',
      title: 'Cơ cấu Cổ phiếu & CCQ rất chuẩn mực',
      message: `Bạn đang áp dụng hiệu quả mô hình Cốt lõi - Vệ tinh (Core-Satellite): dùng CCQ (${fundPercent.toFixed(0)}%) làm nền tảng vững chắc và Cổ phiếu (${stockPercent.toFixed(0)}%) để tối ưu tăng trưởng.`,
      metric: `${fundPercent.toFixed(0)}% CCQ`,
      actionText: 'Xem danh mục',
      targetTab: 'investments'
    });
  }

  // 3. Phân tích tài sản rủi ro cao (Crypto)
  if (cryptoPercent > 20) {
    score -= 20;
    deductions.push('Tỷ trọng Crypto cao');
    insights.push({
      id: 'inv-crypto-high',
      type: 'warning',
      category: 'investment',
      priority: 'high',
      title: 'Tỷ trọng Crypto vượt ngưỡng khuyến nghị',
      message: `Tài sản biến động cao (Crypto) đang chiếm ${cryptoPercent.toFixed(1)}% tổng danh mục. Để bảo vệ thành quả tài chính, nên duy trì dưới mức 10-15% và chốt lời dần sang tài sản tích lũy.`,
      metric: `${cryptoPercent.toFixed(0)}% Crypto`,
      actionText: 'Cân bằng lại vị thế',
      targetTab: 'investments'
    });
  }

  // 4. Rủi ro tập trung vào 1 mã duy nhất (Single Asset Concentration Risk)
  if (assets.length > 1 && totalMarketValue > 0) {
    let highestRatio = 0;
    let concentratedAsset: InvestmentAsset | null = null;

    assets.forEach(a => {
      const val = Math.max(0, a.quantity) * (a.currentPrice || a.avgBuyPrice || 0);
      const ratio = val / totalMarketValue;
      if (ratio > highestRatio) {
        highestRatio = ratio;
        concentratedAsset = a;
      }
    });

    if (highestRatio >= 0.40 && concentratedAsset) {
      score -= 15;
      const pct = (highestRatio * 100).toFixed(1);
      const aName = (concentratedAsset as InvestmentAsset).symbol;
      deductions.push(`Tập trung quá mức vào ${aName}`);
      insights.push({
        id: `inv-conc-${(concentratedAsset as InvestmentAsset).id}`,
        type: 'warning',
        category: 'investment',
        priority: 'high',
        title: `Rủi ro tập trung cao vào mã ${aName}`,
        message: `Mã ${aName} đang chiếm tới ${pct}% toàn bộ danh mục đầu tư. Nếu doanh nghiệp/tài sản này gặp biến cố, toàn bộ danh mục sẽ chịu ảnh hưởng lớn. Nên dàn trải phân bổ sang các mã hoặc CCQ khác.`,
        metric: `${pct}% danh mục`,
        actionText: `Xem mã ${aName}`,
        targetTab: 'investments',
        targetAssetId: (concentratedAsset as InvestmentAsset).id
      });
    }
  }

  // 5. Kiểm tra Chốt lời kỷ luật (Take Profit) & Cắt lỗ (Stop Loss)
  assets.forEach(a => {
    if (a.quantity <= 0) return;

    // Check Take Profit
    if (a.targetPrice && a.targetPrice > 0 && a.currentPrice >= a.targetPrice) {
      insights.push({
        id: `inv-tp-${a.id}`,
        type: 'tip',
        category: 'investment',
        priority: 'high',
        title: `🎯 ${a.symbol} đã đạt giá mục tiêu chốt lời`,
        message: `Thị giá ${a.symbol} hiện tại (${a.currentPrice.toLocaleString('vi-VN')} đ) đã chạm hoặc vượt giá kỳ vọng (${a.targetPrice.toLocaleString('vi-VN')} đ). Hãy cân nhắc hiện thực hóa một phần lợi nhuận (30-50%) theo kỷ luật.`,
        metric: 'Đạt mục tiêu',
        actionText: `Xem mã ${a.symbol}`,
        targetTab: 'investments',
        targetAssetId: a.id
      });
    }

    // Check Stop Loss
    if (a.stopLossPrice && a.stopLossPrice > 0 && a.currentPrice <= a.stopLossPrice) {
      score -= 10;
      insights.push({
        id: `inv-sl-${a.id}`,
        type: 'warning',
        category: 'investment',
        priority: 'high',
        title: `🛑 ${a.symbol} đã chạm ngưỡng cắt lỗ kỷ luật`,
        message: `Thị giá ${a.symbol} (${a.currentPrice.toLocaleString('vi-VN')} đ) đã chạm/thủng giá cắt lỗ đề ra (${a.stopLossPrice.toLocaleString('vi-VN')} đ). Đánh giá lại triển vọng để quản trị rủi ro và bảo vệ vốn.`,
        metric: 'Chạm cắt lỗ',
        actionText: `Kiểm tra mã ${a.symbol}`,
        targetTab: 'investments',
        targetAssetId: a.id
      });
    }

    // Check Savings Maturity
    if (a.assetClass === 'savings' && a.maturityDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const matDate = new Date(a.maturityDate);
      matDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((matDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 14) {
        insights.push({
          id: `inv-mat-${a.id}`,
          type: 'forecast',
          category: 'investment',
          priority: 'medium',
          title: `Sổ tiết kiệm ${a.symbol || a.name} sắp đáo hạn`,
          message: `Khoản tiền gửi ${a.name} (${(a.quantity * (a.currentPrice || a.avgBuyPrice)).toLocaleString('vi-VN')} đ) còn ${diffDays === 0 ? 'hôm nay' : diffDays + ' ngày nữa'} là đến ngày đáo hạn (${a.maturityDate}). Chuẩn bị phương án tái tục hoặc tìm kỳ hạn tối ưu lãi suất.`,
          metric: diffDays === 0 ? 'Đáo hạn hôm nay' : `Còn ${diffDays} ngày`,
          actionText: 'Xem sổ tiết kiệm',
          targetTab: 'investments',
          targetAssetId: a.id
        });
      }
    }
  });

  // 6. Nếu danh mục đang cân bằng rất tốt và không có cảnh báo
  if (insights.filter(i => i.type === 'warning').length === 0 && totalMarketValue > 0) {
    const pnlPercent = portfolioSummary?.unrealizedPnLPercent || 0;
    insights.push({
      id: 'inv-balanced-portfolio',
      type: 'tip',
      category: 'investment',
      priority: 'low',
      title: 'Cơ cấu danh mục đầu tư cân bằng',
      message: `Danh mục đang được phân bổ hợp lý giữa tăng trưởng và an toàn. Tỷ suất lợi nhuận chưa thực hiện hiện tại là ${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%. Tiếp tục duy trì kế hoạch tích lũy định kỳ!`,
      metric: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`,
      actionText: 'Xem danh mục',
      targetTab: 'investments'
    });
  }

  // Đảm bảo score trong khoảng 0 - 100
  const finalScore = Math.max(20, Math.min(100, score));
  let rating: PortfolioHealthAssessment['rating'] = 'excellent';
  let label = 'Rất cân bằng';
  let badgeColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800';

  if (finalScore < 60) {
    rating = 'needs_rebalance';
    label = 'Cần tái cân bằng';
    badgeColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800';
  } else if (finalScore < 75) {
    rating = 'moderate';
    label = 'Trung bình';
    badgeColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800';
  } else if (finalScore < 90) {
    rating = 'good';
    label = 'Khá tốt';
    badgeColor = 'text-primary-700 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800';
  }

  return {
    insights,
    health: {
      score: finalScore,
      rating,
      label,
      badgeColor,
      insights
    }
  };
}
