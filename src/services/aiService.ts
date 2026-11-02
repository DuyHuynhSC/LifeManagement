import { Asset, Expense, Budget, AIInsight } from '../types';
import { InvestmentAsset, InvestmentTransaction, PortfolioSummary } from '../types/investment';
import { getCurrentYearMonth } from '../store/useAppStore';
import { generatePortfolioInsights } from './investmentAdvisor';

export function generateAIInsights(
  assets: Asset[],
  expenses: Expense[],
  budgets: Budget[],
  notifyDays: number,
  investmentAssets?: InvestmentAsset[],
  portfolioSummary?: PortfolioSummary,
  transactions?: InvestmentTransaction[]
): AIInsight[] {
  const insights: AIInsight[] = [];

  // 1. Phân tích Đầu tư & Danh mục (Cổ phiếu, CCQ, Tiết kiệm, Vàng...)
  if (investmentAssets !== undefined) {
    const { insights: portfolioInsights } = generatePortfolioInsights(
      investmentAssets,
      portfolioSummary,
      transactions
    );
    insights.push(...portfolioInsights);
  }

  // 2. Kiểm tra linh kiện hao mòn thiết bị gia đình trong ngưỡng cảnh báo
  let totalUpcomingMaintenanceCost = 0;
  let criticalComponentsCount = 0;

  assets.forEach(asset => {
    asset.components.forEach(comp => {
      if (comp.currentWearPercent <= 20) {
        criticalComponentsCount++;
        totalUpcomingMaintenanceCost += comp.replacementCost;
      }
    });
  });

  if (criticalComponentsCount > 0) {
    insights.push({
      id: 'ai-maintenance-1',
      type: 'forecast',
      category: 'maintenance',
      priority: 'high',
      title: 'Dự báo chi phí bảo trì thiết bị sắp tới',
      message: `Gia đình có ${criticalComponentsCount} linh kiện đã hao mòn trên 80% trong ngưỡng thông báo ${notifyDays} ngày. Dự kiến chi phí thay thế cần chuẩn bị là ${totalUpcomingMaintenanceCost.toLocaleString('vi-VN')} đ.`,
      estimatedSaving: Math.round(totalUpcomingMaintenanceCost * 0.15),
      metric: `~${totalUpcomingMaintenanceCost.toLocaleString('vi-VN')} đ`,
      actionText: 'Xem danh sách linh kiện',
      targetTab: 'assets'
    });
  }

  // 3. Phân tích Chi tiêu vs Hạn mức Ngân sách tháng
  const currentMonth = getCurrentYearMonth();
  const currentMonthExpenses = expenses
    .filter(e => e.date.startsWith(currentMonth))
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  budgets
    .filter(b => (b.month || currentMonth) === currentMonth && b.monthlyLimit > 0)
    .forEach(b => {
      const spent = currentMonthExpenses[b.category] || 0;
      const ratio = spent / b.monthlyLimit;
      if (ratio >= 0.85) {
        insights.push({
          id: `ai-budget-${b.category}`,
          type: 'warning',
          category: 'budget',
          priority: ratio >= 1 ? 'high' : 'medium',
          title: ratio >= 1 ? `Ngân sách "${b.category}" đã vượt mức` : `Cảnh báo ngân sách "${b.category}"`,
          message: `Hạng mục "${b.category}" đã tiêu ${spent.toLocaleString('vi-VN')} đ (${Math.round(ratio * 100)}% ngân sách tháng ${currentMonth}). Hãy cân đối chi tiêu để tránh thâm hụt cuối tháng!`,
          metric: `${Math.round(ratio * 100)}%`,
          actionText: 'Kiểm tra chi tiêu',
          targetTab: 'expenses'
        });
      }
    });

  // 4. Mẹo thông minh bổ trợ khi chưa có nhiều dữ liệu cảnh báo
  if (assets.length === 0 && expenses.length === 0 && (!investmentAssets || investmentAssets.length === 0)) {
    insights.push({
      id: 'ai-welcome',
      type: 'tip',
      category: 'general',
      priority: 'low',
      title: 'Khởi đầu thông minh cùng FamLife',
      message: 'Chào mừng bạn đến với FamLife! Hãy bắt đầu bằng cách thêm thiết bị gia đình hoặc khoản đầu tư đầu tiên để trợ lý AI tự động theo dõi bảo hành và tối ưu tài chính gia đình.',
      actionText: 'Bắt đầu ngay',
      targetTab: 'assets'
    });
  } else if (insights.length < 2) {
    const hasAirConditioner = assets.some(a => a.name.toLowerCase().includes('điều hòa') || a.category.toLowerCase().includes('điện lạnh'));
    if (hasAirConditioner) {
      insights.push({
        id: 'ai-ac-tip',
        type: 'tip',
        category: 'maintenance',
        priority: 'low',
        title: 'Mẹo tối ưu điện năng điều hòa',
        message: 'Duy trì điều hòa ở mức 26°C kết hợp quạt gió và hẹn giờ tắt trước khi thức dậy 30 phút giúp tiết kiệm khoảng 12% điện năng sinh hoạt mỗi tháng.',
        estimatedSaving: 150000,
        metric: 'Tiết kiệm ~150k/tháng',
        actionText: 'Xem thiết bị',
        targetTab: 'assets'
      });
    } else {
      insights.push({
        id: 'ai-general-tip',
        type: 'tip',
        category: 'maintenance',
        priority: 'low',
        title: 'Bảo dưỡng định kỳ đồ dùng',
        message: 'Vệ sinh định kỳ và thay thế linh kiện hao mòn đúng hạn giúp thiết bị gia đình hoạt động bền bỉ hơn 30% và giảm nguy cơ chập cháy điện.',
        estimatedSaving: 200000,
        metric: 'Tiết kiệm ~200k',
        actionText: 'Xem đồ dùng',
        targetTab: 'assets'
      });
    }
  }

  // Sắp xếp ưu tiên: cảnh báo rủi ro / vượt ngân sách (high) trước, sau đó là medium và low
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => {
    const pA = priorityOrder[a.priority || 'medium'];
    const pB = priorityOrder[b.priority || 'medium'];
    return pA - pB;
  });

  return insights;
}
