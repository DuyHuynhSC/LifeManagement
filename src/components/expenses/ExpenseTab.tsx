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

      {/* Monthly Budget Summary Banner - Compact Redesign */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-2xl p-3.5 text-white shadow-md space-y-2 relative overflow-hidden w-full max-w-full min-w-0">
        <div className="relative z-10 space-y-1.5">
          {/* Header Row: Month Switcher & Budget Limit Chip */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="inline-flex items-center gap-0.5 bg-black/20 backdrop-blur-sm rounded-full p-0.5 border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedBudgetMonth(prev => shiftYearMonth(prev, -1))}
                className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition active:scale-95"
                title="Tháng trước"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-[11px] font-bold px-1 text-white whitespace-nowrap">
                {formatYearMonthDisplay(selectedBudgetMonth)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedBudgetMonth(prev => shiftYearMonth(prev, 1))}
                className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition active:scale-95"
                title="Tháng sau"
              >
                <ChevronRight size={13} />
              </button>
              {selectedBudgetMonth !== currentMonth && (
                <button
                  type="button"
                  onClick={() => setSelectedBudgetMonth(currentMonth)}
                  className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-white text-emerald-800 hover:bg-emerald-50 transition shrink-0 ml-0.5"
                >
                  Hiện tại
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {canManage ? (
                <button
                  onClick={() => setShowBudgetModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition text-[11px] text-emerald-50 font-medium backdrop-blur-sm border border-white/10 shrink-0"
                  title="Cài đặt hạn mức tháng"
                >
                  <span className="truncate">
                    {t('dash_budget_limit')}:{' '}
                    <strong className="font-bold text-white">
                      {totalBudget > 0 ? `${totalBudget.toLocaleString('vi-VN')} đ` : 'Chưa đặt'}
                    </strong>
                  </span>
                  <Pencil size={10} className="opacity-80 shrink-0" />
                </button>
              ) : (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[11px] text-emerald-100 font-medium shrink-0">
                  <span className="truncate">
                    {t('dash_budget_limit')}:{' '}
                    <strong className="font-bold text-white">
                      {totalBudget > 0 ? `${totalBudget.toLocaleString('vi-VN')} đ` : 'Chưa đặt'}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Amount & Remaining Split Row */}
          <div className="flex items-end justify-between gap-2">
            <div className="text-xl sm:text-2xl font-black tracking-tight whitespace-nowrap leading-none">
              {totalSpent.toLocaleString('vi-VN')} <span className="text-xs sm:text-sm font-bold opacity-80">đ</span>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-white leading-tight">
                {totalBudget > 0 ? (
                  totalSpent > totalBudget ? (
                    <span className="text-rose-200">Vượt: {(totalSpent - totalBudget).toLocaleString('vi-VN')} đ</span>
                  ) : (
                    <span>Còn dư: {(totalBudget - totalSpent).toLocaleString('vi-VN')} đ</span>
                  )
                ) : (
                  <span className="text-emerald-100 text-[11px]">Chưa đặt ngân sách</span>
                )}
              </div>
              {totalBudget > 0 && (
                <div className="text-[10px] text-emerald-100 font-semibold mt-0.5">
                  {percentSpent}% ngân sách
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thin Progress Bar */}
        <div className="w-full bg-black/20 backdrop-blur h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 shadow-sm ${
              percentSpent > 100 ? 'bg-rose-300' : 'bg-white'
            }`}
            style={{ width: `${totalBudget > 0 ? Math.min(100, percentSpent) : 0}%` }}
          />
        </div>

        {/* Bottom Micro-actions: Chart Toggle Bar */}
        {chartData.length > 0 && (
          <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-100 border-t border-white/10">
            <span className="text-[10px] text-emerald-100/90 font-medium">
              {totalSpent > totalBudget && totalBudget > 0 ? '⚠️ Vượt hạn mức tháng' : '✓ Trong tầm kiểm soát'}
            </span>
            <button
              onClick={() => setShowChart(prev => !prev)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/20 hover:bg-white/20 active:scale-95 transition text-[11px] font-semibold text-white backdrop-blur-sm"
            >
              <BarChart3 size={11} />
              <span>{showChart ? 'Ẩn cơ cấu' : 'Xem cơ cấu'}</span>
              <ChevronDown size={11} className={`transform transition-transform duration-200 ${showChart ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Category Breakdown Chart & Per-Category Monthly Limit Progress */}
      {showChart && chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 w-full max-w-full overflow-hidden min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">
              Cơ cấu chi tiêu {formatYearMonthDisplay(selectedBudgetMonth)}
            </h2>
            <button
              onClick={() => setShowChart(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-xs flex items-center gap-1 transition shrink-0"
              title="Ẩn biểu đồ"
            >
              <span>Thu gọn</span>
              <TrendingUp size={14} className="text-emerald-500" />
            </button>
          </div>

          {chartData.some(d => d.total > 0) && (
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.filter(d => d.total > 0)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickFormatter={val => `${Math.round(val / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} đ`, 'Chi tiêu']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {chartData.filter(d => d.total > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-category budget progress for selectedBudgetMonth */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Chi tiết theo nhóm ({formatYearMonthDisplay(selectedBudgetMonth)}):
            </div>
            {chartData.map(item => {
              const pct = item.limit > 0 ? Math.round((item.total / item.limit) * 100) : 0;
              const isOver = item.limit > 0 && item.total > item.limit;
              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      <strong className={isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}>
                        {item.total.toLocaleString('vi-VN')} đ
                      </strong>
                      {item.limit > 0 ? ` / ${item.limit.toLocaleString('vi-VN')} đ (${pct}%)` : ' (Chưa đặt hạn mức)'}
                    </span>
                  </div>
                  {item.limit > 0 && (
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOver ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
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
          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60">
            <span>Tổng chi tiêu đang lọc:</span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400">
              -{filteredTotalSpent.toLocaleString('vi-VN')} đ
            </span>
          </div>
        )}

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-300 text-xs bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
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
          <div className="space-y-2">
            {filteredExpenses.map(exp => {
              const itemCat = categoryMap[exp.category];
              const cat = { label: itemCat?.name || exp.category, color: itemCat?.color || '#64748b', icon: itemCat?.icon || '📦' };
              const payerName = userMap[exp.payerId] || exp.payerId;
              const linkedAsset = exp.assetId ? assetMap[exp.assetId] : null;

              return (
                <div
                  key={exp.id}
                  className="p-2.5 sm:p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/70 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-2.5 w-full max-w-full overflow-hidden min-w-0"
                >
                  {/* Category Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs"
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
                      <span>{exp.date}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="truncate max-w-[70px]" title={payerName}>{payerName}</span>
                      {linkedAsset && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span
                            className="text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[90px]"
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
                    <div className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 whitespace-nowrap tracking-tight">
                      -{exp.amount.toLocaleString('vi-VN')} đ
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition active:scale-95"
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
