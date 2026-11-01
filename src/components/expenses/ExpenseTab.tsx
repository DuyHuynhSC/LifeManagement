import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Wallet, 
  Trash2, 
  Mic, 
  TrendingUp, 
  Calendar,
  Pencil,
  QrCode,
  RotateCcw,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Target
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import { Expense, PendingBankTransaction } from '../../types';
import { useAppStore, getCurrentYearMonth } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { AddExpenseModal } from './AddExpenseModal';
import { BudgetModal, shiftYearMonth, formatYearMonthDisplay } from './BudgetModal';
import { BankTransactionSuggestionBanner } from './BankTransactionSuggestionBanner';
import { Building2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ExpenseTabProps {
  onOpenVoiceInput: () => void;
  onOpenQRScanner?: () => void;
  onEditBankTransaction?: (tx: PendingBankTransaction) => void;
  onOpenBankSync?: () => void;
}

export const ExpenseTab: React.FC<ExpenseTabProps> = ({ 
  onOpenVoiceInput,
  onOpenQRScanner,
  onEditBankTransaction,
  onOpenBankSync
}) => {
  const { expenses, budgets, categories, deleteExpense, users, currentUser, settings, assets, pendingTransactions } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const currentMonth = getCurrentYearMonth();
  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState<string>(currentMonth);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'this_month' | 'last_month' | 'selected_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  const assetMap = Object.fromEntries(assets.map(a => [a.id, a.name]));

  // Monthly totals for selectedBudgetMonth
  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(selectedBudgetMonth));
  }, [expenses, selectedBudgetMonth]);

  const monthlyBudgets = useMemo(() => {
    return budgets.filter(b => (b.month || currentMonth) === selectedBudgetMonth);
  }, [budgets, selectedBudgetMonth, currentMonth]);

  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = monthlyBudgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const percentSpent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Group by category for Chart & Category Budget Breakdown (scoped to selectedBudgetMonth)
  const categoryBreakdown = useMemo(() => {
    return categories.map(cat => {
      const total = monthlyExpenses
        .filter(e => e.category === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const budgetObj = monthlyBudgets.find(b => b.category === cat.id);
      const limit = budgetObj?.monthlyLimit || 0;
      return {
        category: cat.id,
        label: cat.name,
        icon: cat.icon || '📦',
        total,
        limit,
        color: cat.color || '#10b981'
      };
    });
  }, [categories, monthlyExpenses, monthlyBudgets]);

  const chartData = useMemo(() => {
    return categoryBreakdown.filter(d => d.total > 0 || d.limit > 0);
  }, [categoryBreakdown]);

  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filtered transactions (filtered by category and date, sorted by date descending)
  const filteredExpenses = expenses.filter(exp => {
    // 1. Category Filter
    if (selectedCategoryFilter !== 'all' && exp.category !== selectedCategoryFilter) {
      return false;
    }

    // 2. Date Filter
    if (dateFilter === 'all') return true;

    const today = new Date();
    const todayStr = formatLocalDate(today);

    if (dateFilter === 'today') {
      return exp.date === todayStr;
    }

    if (dateFilter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return exp.date === formatLocalDate(yesterday);
    }

    if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return exp.date >= formatLocalDate(weekAgo) && exp.date <= todayStr;
    }

    if (dateFilter === 'this_month') {
      const currentMonthPrefix = todayStr.substring(0, 7); // 'YYYY-MM'
      return exp.date.startsWith(currentMonthPrefix);
    }

    if (dateFilter === 'last_month') {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthPrefix = formatLocalDate(lastMonthDate).substring(0, 7);
      return exp.date.startsWith(lastMonthPrefix);
    }

    if (dateFilter === 'selected_month') {
      return exp.date.startsWith(selectedBudgetMonth);
    }

    if (dateFilter === 'custom') {
      if (startDate && exp.date < startDate) return false;
      if (endDate && exp.date > endDate) return false;
      return true;
    }

    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isFiltered = selectedCategoryFilter !== 'all' || dateFilter !== 'all' || Boolean(startDate) || Boolean(endDate);
  const filteredTotalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Xóa khoản chi tiêu "${title}"?`)) {
      deleteExpense(id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 space-y-3.5 sm:space-y-4 pb-20 w-full max-w-full min-w-0">
      {/* Title & Action Buttons */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate min-w-0">
          {t('expense_title')}
        </h1>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenBankSync && (
            <button
              onClick={onOpenBankSync}
              className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center hover:bg-teal-100 dark:hover:bg-teal-900/40 transition active:scale-95"
              title="Đồng bộ Ngân hàng & MoMo"
            >
              <Building2 size={15} />
              {pendingTransactions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {pendingTransactions.length}
                </span>
              )}
            </button>
          )}
          {onOpenQRScanner && (
            <button
              onClick={onOpenQRScanner}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/40 transition active:scale-95"
              title={t('action_scan_qr')}
            >
              <QrCode size={15} />
            </button>
          )}
          <button
            onClick={onOpenVoiceInput}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center hover:bg-purple-100 transition active:scale-95"
            title="Nói để nhập chi tiêu"
          >
            <Mic size={15} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus size={15} />
            <span className="hidden xs:inline">{t('action_add')}</span>
            <span className="xs:hidden">Thêm</span>
          </button>
        </div>
      </div>

      {/* Suggestion Banner */}
      {onEditBankTransaction && (
        <BankTransactionSuggestionBanner
          onEditTransaction={onEditBankTransaction}
          onOpenSyncSettings={onOpenBankSync}
        />
      )}

      {/* Monthly Budget Summary Banner - FinTech Clean Surface */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3.5 relative w-full max-w-full min-w-0">
        <div className="space-y-2">
          {/* Header Row: Month Switcher & Budget Limit Chip */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="inline-flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700/80 rounded-full p-0.5 border border-slate-200/60 dark:border-slate-600/60 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedBudgetMonth(prev => shiftYearMonth(prev, -1))}
                className="w-5 h-5 rounded-full hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition active:scale-95 shadow-2xs"
                title="Tháng trước"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-[11px] font-bold px-1.5 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {formatYearMonthDisplay(selectedBudgetMonth)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedBudgetMonth(prev => shiftYearMonth(prev, 1))}
                className="w-5 h-5 rounded-full hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition active:scale-95 shadow-2xs"
                title="Tháng sau"
              >
                <ChevronRight size={13} />
              </button>
              {selectedBudgetMonth !== currentMonth && (
                <button
                  type="button"
                  onClick={() => setSelectedBudgetMonth(currentMonth)}
                  className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition shrink-0 ml-0.5 shadow-2xs"
                >
                  Hiện tại
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {canManage ? (
                <button
                  onClick={() => setShowBudgetModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 transition text-[11px] text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-600 shrink-0 shadow-2xs"
                  title="Cài đặt hạn mức tháng"
                >
                  <span className="truncate">
                    {t('dash_budget_limit')}:{' '}
                    <strong className="font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                      {totalBudget > 0 ? `${totalBudget.toLocaleString('vi-VN')} đ` : 'Chưa đặt'}
                    </strong>
                  </span>
                  <Pencil size={10} className="text-primary-600 dark:text-primary-400 shrink-0 ml-0.5" />
                </button>
              ) : (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-[11px] text-slate-600 dark:text-slate-300 font-medium shrink-0 border border-slate-200 dark:border-slate-600">
                  <span className="truncate">
                    {t('dash_budget_limit')}:{' '}
                    <strong className="font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                      {totalBudget > 0 ? `${totalBudget.toLocaleString('vi-VN')} đ` : 'Chưa đặt'}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Amount & Remaining Split Row */}
          <div className="flex items-baseline justify-between gap-2 pt-1">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                {t('expense_total_monthly')}
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono tabular-nums whitespace-nowrap leading-none">
                {totalSpent.toLocaleString('vi-VN')} <span className="text-xs sm:text-sm font-bold font-sans text-slate-400">đ</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className={cn(
                "text-xs font-bold font-mono tabular-nums leading-tight",
                totalBudget > 0
                  ? totalSpent > totalBudget
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              )}>
                {totalBudget > 0 ? (
                  totalSpent > totalBudget ? (
                    <span>Vượt: {(totalSpent - totalBudget).toLocaleString('vi-VN')} đ</span>
                  ) : (
                    <span>Còn dư: {(totalBudget - totalSpent).toLocaleString('vi-VN')} đ</span>
                  )
                ) : (
                  <span className="text-slate-400 text-[11px] font-sans font-medium">Chưa đặt ngân sách</span>
                )}
              </div>
              {totalBudget > 0 && (
                <div className={cn(
                  "text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-mono tabular-nums shadow-2xs",
                  percentSpent > 100 
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                    : percentSpent >= 80 
                      ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                )}>
                  <span>{percentSpent > 100 ? '⚠️' : percentSpent >= 80 ? '⚡' : '✓'}</span>
                  <span>{percentSpent}% ngân sách</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar with FinTech Clean styling */}
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 shadow-xs",
              percentSpent > 100 ? "bg-rose-500" : percentSpent >= 80 ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ width: `${totalBudget > 0 ? Math.min(100, percentSpent) : 0}%` }}
          />
        </div>

        {/* Bottom Micro-actions: Chart Toggle Bar */}
        {chartData.length > 0 && (
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/80">
            <span className="text-[11px] font-medium flex items-center gap-1">
              {totalSpent > totalBudget && totalBudget > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold">⚠️ Vượt hạn mức tháng</span>
              ) : percentSpent >= 80 && totalBudget > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">⚡ Cảnh báo &gt;80% hạn mức</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Trong tầm kiểm soát</span>
              )}
            </span>
            <button
              onClick={() => setShowChart(prev => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 transition text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs"
            >
              <BarChart3 size={12} className="text-primary-600 dark:text-primary-400" />
              <span>{showChart ? 'Ẩn cơ cấu' : 'Xem cơ cấu'}</span>
              <ChevronDown size={12} className={`transform transition-transform duration-200 ${showChart ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Category Breakdown Chart & Per-Category Monthly Limit Progress */}
      {showChart && chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 w-full max-w-full overflow-hidden min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider truncate">
              Cơ cấu chi tiêu {formatYearMonthDisplay(selectedBudgetMonth)}
            </h2>
            <button
              onClick={() => setShowChart(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-xs flex items-center gap-1 transition shrink-0"
              title="Ẩn biểu đồ"
            >
              <span>Thu gọn</span>
              <TrendingUp size={14} className="text-primary-600 dark:text-primary-400" />
            </button>
          </div>

          {chartData.some(d => d.total > 0) && (
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.filter(d => d.total > 0)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    tickFormatter={val => `${Math.round(val / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} đ`, 'Chi tiêu']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {chartData.filter(d => d.total > 0).map((entry, index) => {
                      const pct = entry.limit > 0 ? (entry.total / entry.limit) * 100 : 0;
                      // Dynamic semantic alert colors: Over (>100%) -> Red 600, Alert (>=80%) -> Amber 500, Safe -> Sky 600
                      const barColor = entry.limit > 0 
                        ? (pct > 100 ? '#DC2626' : pct >= 80 ? '#F59E0B' : '#0284C7')
                        : entry.color || '#0284C7';
                      return (
                        <Cell key={`cell-${index}`} fill={barColor} />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-category budget progress for selectedBudgetMonth with Dynamic Budget Alerts */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Chi tiết theo nhóm ({formatYearMonthDisplay(selectedBudgetMonth)}):
            </div>
            {chartData.map(item => {
              const pct = item.limit > 0 ? Math.round((item.total / item.limit) * 100) : 0;
              const isOver = item.limit > 0 && item.total > item.limit;
              const isWarning = item.limit > 0 && pct >= 80 && !isOver;

              return (
                <div 
                  key={item.category} 
                  className={cn(
                    "p-2.5 rounded-xl transition-all space-y-1.5 border",
                    isOver 
                      ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60" 
                      : isWarning 
                        ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60" 
                        : "bg-slate-50/60 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60"
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span>{item.icon}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                      {isOver && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-300/60">
                          ⚠️ Vượt trần
                        </span>
                      )}
                      {isWarning && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 border border-amber-300/60 animate-pulse">
                          ⚡ Cảnh báo &gt;80%
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "font-mono tabular-nums font-bold",
                        isOver ? "text-rose-600 dark:text-rose-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"
                      )}>
                        {item.total.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1 font-mono tabular-nums">
                        {item.limit > 0 ? `/ ${item.limit.toLocaleString('vi-VN')} đ (${pct}%)` : '(Chưa đặt hạn mức)'}
                      </span>
                    </div>
                  </div>
                  {item.limit > 0 && (
                    <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isOver ? "bg-rose-600" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      <div className="space-y-3">
        {/* Section Header: Title, Active Filter Badge & Reset Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('expense_history')} ({filteredExpenses.length})
            </h2>
            {isFiltered && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                Đang lọc
              </span>
            )}
          </div>

          {isFiltered && (
            <button
              onClick={() => {
                setSelectedCategoryFilter('all');
                setDateFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-medium flex items-center gap-1 transition"
            >
              <RotateCcw size={12} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        {/* Filter Controls: Category & Date Dropdowns */}
        <div className="grid grid-cols-2 gap-2">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="w-full text-[11px] py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium outline-none truncate shadow-2xs"
            >
              <option value="all">📁 Tất cả danh mục</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={e => {
                const val = e.target.value as any;
                setDateFilter(val);
                if (val !== 'custom') {
                  setStartDate('');
                  setEndDate('');
                }
                if (val === 'this_month') {
                  setSelectedBudgetMonth(currentMonth);
                } else if (val === 'last_month') {
                  setSelectedBudgetMonth(shiftYearMonth(currentMonth, -1));
                }
              }}
              className="w-full text-[11px] py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium outline-none truncate shadow-2xs"
            >
              <option value="all">📅 Tất cả thời gian</option>
              <option value="selected_month">🎯 Theo {formatYearMonthDisplay(selectedBudgetMonth)}</option>
              <option value="today">⚡ Hôm nay</option>
              <option value="yesterday">⏪ Hôm qua</option>
              <option value="week">🗓️ 7 ngày qua</option>
              <option value="this_month">📆 Tháng này</option>
              <option value="last_month">⏮️ Tháng trước</option>
              <option value="custom">🔍 Chọn khoảng ngày...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker (shown when 'custom' selected) */}
        {dateFilter === 'custom' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-500" />
                Khoảng ngày giao dịch:
              </span>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-[10px] text-rose-500 dark:text-rose-400 hover:underline font-medium"
                >
                  Xóa ngày
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-300 font-medium mb-1">
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full text-[11px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-300 font-medium mb-1">
                  Đến ngày:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full text-[11px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Summary Row */}
        {isFiltered && filteredExpenses.length > 0 && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <span>Tổng chi tiêu đang lọc:</span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
              -{filteredTotalSpent.toLocaleString('vi-VN')} đ
            </span>
          </div>
        )}

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-300 text-xs bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
            <Wallet size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              {isFiltered ? 'Không có chi tiêu nào phù hợp bộ lọc.' : 'Chưa có giao dịch chi tiêu nào.'}
            </p>
            <p className="text-[11px]">
              {isFiltered 
                ? 'Hãy thử chọn khoảng thời gian hoặc danh mục khác.' 
                : 'Bấm "+ Thêm" hoặc dùng giọng nói để ghi lại khoản chi của bạn.'}
            </p>
            {isFiltered && (
              <button
                onClick={() => {
                  setSelectedCategoryFilter('all');
                  setDateFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition"
              >
                <RotateCcw size={12} />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredExpenses.map(exp => {
              const itemCat = categoryMap[exp.category];
              const cat = { label: itemCat?.name || exp.category, color: itemCat?.color || '#64748b', icon: itemCat?.icon || '📦' };
              const payerName = userMap[exp.payerId] || exp.payerId;
              const linkedAsset = exp.assetId ? assetMap[exp.assetId] : null;

              return (
                <div
                  key={exp.id}
                  className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-between gap-2.5 w-full max-w-full overflow-hidden min-w-0"
                >
                  {/* Category Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      border: `1px solid ${cat.color}30`
                    }}
                  >
                    <span>{cat.icon || '💳'}</span>
                  </div>

                  {/* Main Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3
                        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
                        title={exp.title}
                      >
                        {exp.title}
                      </h3>
                      {exp.notes && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 truncate italic hidden xs:inline" title={exp.notes}>
                          ({exp.notes})
                        </span>
                      )}
                    </div>

                    {/* Metadata: Category Badge + Date + Payer (+ Asset) */}
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 mt-0.5 text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                      <span
                        className="font-bold px-1.5 py-0.2 rounded-md shrink-0"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                          border: `1px solid ${cat.color}25`
                        }}
                      >
                        {cat.label}
                      </span>
                      <span className="font-mono tabular-nums">{exp.date}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="truncate max-w-[70px]" title={payerName}>{payerName}</span>
                      {linkedAsset && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span
                            className="text-primary-600 dark:text-primary-400 font-medium truncate max-w-[90px]"
                            title={linkedAsset}
                          >
                            📦 {linkedAsset}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount & Quick Actions */}
                  <div className="shrink-0 text-right flex flex-col items-end justify-center pl-1">
                    <div className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 whitespace-nowrap tracking-tight font-mono tabular-nums">
                      -{exp.amount.toLocaleString('vi-VN')} đ
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1 rounded-md text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition active:scale-95"
                          title="Chỉnh sửa chi tiêu"
                          aria-label="Chỉnh sửa chi tiêu"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id, exp.title)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition active:scale-95"
                          title="Xóa chi tiêu"
                          aria-label="Xóa chi tiêu"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddExpenseModal
          onClose={() => setShowAddModal(false)}
          onOpenVoiceInput={onOpenVoiceInput}
          onOpenQRScanner={onOpenQRScanner ? () => {
            setShowAddModal(false);
            onOpenQRScanner();
          } : undefined}
        />
      )}

      {editingExpense && (
        <AddExpenseModal
          expenseToEdit={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {showBudgetModal && (
        <BudgetModal
          initialMonth={selectedBudgetMonth}
          onMonthChange={setSelectedBudgetMonth}
          onClose={() => setShowBudgetModal(false)}
        />
      )}
    </div>
  );
};
