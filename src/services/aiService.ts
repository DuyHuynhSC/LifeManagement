import { Asset, Expense, Budget, AIInsight } from '../types';

export function generateAIInsights(
  assets: Asset[],
  expenses: Expense[],
  budgets: Budget[],
  notifyDays: number
): AIInsight[] {
  const insights: AIInsight[] = [];

  // 1. Check components wearing out within notify threshold
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
      id: 'ai-1',
      type: 'forecast',
      title: 'Dự báo chi phí bảo trì sắp tới',
      message: `Gia đình có ${criticalComponentsCount} linh kiện đã hao mòn trên 80% trong ngưỡng thông báo ${notifyDays} ngày. Dự kiến chi phí thay thế cần chuẩn bị là ${totalUpcomingMaintenanceCost.toLocaleString('vi-VN')} đ.`,
      estimatedSaving: Math.round(totalUpcomingMaintenanceCost * 0.15),
      actionText: 'Xem danh sách linh kiện'
    });
  }

  // 2. Budget vs Expense analysis
  const currentMonthExpenses = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  budgets.forEach(b => {
    const spent = currentMonthExpenses[b.category] || 0;
    const ratio = spent / b.monthlyLimit;
    if (ratio >= 0.85) {
      insights.push({
        id: `ai-budget-${b.category}`,
        type: 'warning',
        title: 'Cảnh báo hạn mức ngân sách',
        message: `Hạng mục "${b.category}" đã tiêu ${spent.toLocaleString('vi-VN')} đ (${Math.round(ratio * 100)}% ngân sách tháng). Hãy cân đối để tránh thâm hụt cuối tháng!`,
        actionText: 'Kiểm tra chi tiêu'
      });
    }
  });

  // 3. Smart Tip based on assets & expenses
  if (assets.length === 0 && expenses.length === 0) {
    insights.push({
      id: 'ai-welcome',
      type: 'tip',
      title: 'Khởi đầu thông minh cùng FamLife',
      message: 'Chào mừng bạn đến với FamLife! Hãy bắt đầu bằng cách thêm thiết bị gia đình đầu tiên hoặc ghi nhận khoản chi tiêu để trợ lý AI tự động theo dõi bảo hành và tối ưu tài chính gia đình.',
      actionText: 'Thêm thiết bị'
    });
  } else {
    const hasAirConditioner = assets.some(a => a.name.toLowerCase().includes('điều hòa') || a.category.toLowerCase().includes('điện lạnh'));
    if (hasAirConditioner) {
      insights.push({
        id: 'ai-3',
        type: 'tip',
        title: 'Gợi ý tiết kiệm điện điều hòa',
        message: 'Duy trì điều hòa ở mức 26°C kết hợp quạt gió và hẹn giờ tắt trước khi thức dậy 30 phút giúp tiết kiệm khoảng 12% điện năng sinh hoạt mỗi tháng.',
        estimatedSaving: 150000,
        actionText: 'Tối ưu năng lượng'
      });
    } else {
      insights.push({
        id: 'ai-general-tip',
        type: 'tip',
        title: 'Bảo dưỡng định kỳ kéo dài tuổi thọ đồ dùng',
        message: 'Vệ sinh định kỳ và thay thế linh kiện hao mòn đúng hạn giúp thiết bị gia đình hoạt động bền bỉ hơn 30% và giảm nguy cơ chập cháy điện.',
        estimatedSaving: 200000,
        actionText: 'Xem đồ dùng'
      });
    }
  }

  return insights;
}
