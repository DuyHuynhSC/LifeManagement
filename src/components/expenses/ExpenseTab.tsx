import React, { useState } from 'react';
import { 
  Plus, 
  Wallet, 
  Trash2, 
  Mic, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowDownRight,
  Filter,
  Pencil,
  QrCode,
  Calendar,
  RotateCcw
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
import { ExpenseCategory, Expense } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { AddExpenseModal } from './AddExpenseModal';
import { BudgetModal } from './BudgetModal';

interface ExpenseTabProps {
  onOpenVoiceInput: () => void;
  onOpenQRScanner?: () => void;
}

export const ExpenseTab: React.FC<ExpenseTabProps> = ({ 
  onOpenVoiceInput,
  onOpenQRScanner 
}) => {
  const { expenses, budgets, deleteExpense, users, currentUser, settings, assets } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'this_month' | 'last_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  // Category labels, colors and icons
  const categoryConfig: Record<ExpenseCategory, { label: string; color: string; icon: string }> = {
    food: { label: t('cat_food'), color: '#10b981', icon: '🍔' },
    utilities: { label: t('cat_utilities'), color: '#3b82f6', icon: '💡' },
    appliances: { label: t('cat_appliances'), color: '#8b5cf6', icon: '📺' },
    maintenance: { label: t('cat_maintenance'), color: '#f59e0b', icon: '🔧' },
    healthcare: { label: t('cat_healthcare'), color: '#ef4444', icon: '💊' },
    education: { label: t('cat_education'), color: '#ec4899', icon: '📚' },
    entertainment: { label: t('cat_entertainment'), color: '#06b6d4', icon: '🎬' },
    other: { label: t('cat_other'), color: '#64748b', icon: '📦' },
  };

  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  const assetMap = Object.fromEntries(assets.map(a => [a.id, a.name]));

  // Monthly totals
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const percentSpent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Group by category for Chart
  const chartData = (Object.keys(categoryConfig) as ExpenseCategory[]).map(cat => {
    const total = expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      category: cat,
      label: categoryConfig[cat].label,
      total,
      color: categoryConfig[cat].color
    };
  }).filter(d => d.total > 0);

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
    <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20">
      {/* Title & Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('expense_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
            Kiểm soát ngân sách & thu chi minh bạch
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenQRScanner && (
            <button
              onClick={onOpenQRScanner}
              className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
              title={t('action_scan_qr')}
            >
              <QrCode size={16} />
            </button>
          )}
          <button
            onClick={onOpenVoiceInput}
            className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center hover:bg-purple-100 transition"
            title="Nói để nhập chi tiêu"
          >
            <Mic size={16} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus size={16} />
            <span>{t('action_add')}</span>
          </button>
        </div>
      </div>

      {/* Monthly Budget Summary Banner */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl p-5 text-white shadow-xl space-y-3 relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          {/* Header Row: Label & Budget Limit Chip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-emerald-100 font-medium tracking-wide">
              {t('dash_total_spent')}
            </span>
            {canManage ? (
              <button
                onClick={() => setShowBudgetModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition text-xs text-emerald-50 font-medium backdrop-blur-sm border border-white/10"
                title="Cài đặt hạn mức"
              >
                <span>{t('dash_budget_limit')}: <strong className="font-bold text-white">{totalBudget > 0 ? `${totalBudget.toLocaleString('vi-VN')} đ` : 'Chưa đặt'}</strong></span>
                <Pencil size={11} className="opacity-80 shrink-0" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs text-emerald-100 font-medium">
                <span>{t('dash_budget_limit')}: <strong className="font-bold text-white">{totalBudget > 0 ? `${totalBudget.toLocaleString('vi-VN')} đ` : 'Chưa đặt'}</strong></span>
              </div>
            )}
          </div>

          {/* Main Amount */}
          <div className="text-2xl sm:text-3xl font-black tracking-tight whitespace-nowrap">
            {totalSpent.toLocaleString('vi-VN')} <span className="text-base sm:text-lg font-bold opacity-90">đ</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/20 backdrop-blur h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${totalBudget > 0 ? Math.min(100, percentSpent) : 0}%` }}
          />
        </div>

        {/* Bottom Details Row */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-emerald-100 font-medium gap-2">
          <span className="truncate">
            {totalBudget > 0 
              ? (totalSpent > totalBudget 
                  ? `Vượt: ${(totalSpent - totalBudget).toLocaleString('vi-VN')} đ` 
                  : `Còn dư: ${(totalBudget - totalSpent).toLocaleString('vi-VN')} đ`)
              : 'Chưa đặt hạn mức'}
          </span>
          <span className="shrink-0 font-semibold text-white">
            {totalBudget > 0 ? `${percentSpent}% ngân sách` : 'Chưa có hạn mức'}
          </span>
        </div>

        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Category Breakdown Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Cơ cấu chi tiêu theo nhóm
            </h2>
            <TrendingUp size={14} className="text-emerald-500" />
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
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
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
              className="w-full text-[11px] py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium outline-none truncate shadow-xs"
            >
              <option value="all">📁 Tất cả danh mục</option>
              {Object.entries(categoryConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.icon} {val.label}</option>
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
              }}
              className="w-full text-[11px] py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium outline-none truncate shadow-xs"
            >
              <option value="all">📅 Tất cả thời gian</option>
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
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60">
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
          <div className="space-y-2.5">
            {filteredExpenses.map(exp => {
              const cat = categoryConfig[exp.category] || categoryConfig.other;
              const payerName = userMap[exp.payerId] || exp.payerId;
              const linkedAsset = exp.assetId ? assetMap[exp.assetId] : null;

              return (
                <div
                  key={exp.id}
                  className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all space-y-2.5"
                >
                  {/* Top Row: Category Icon + Title (+ Notes) & Amount */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Category Icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm mt-0.5"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          border: `1px solid ${cat.color}35`
                        }}
                      >
                        <span>{cat.icon || '💳'}</span>
                      </div>

                      {/* Title & Notes */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h3
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug break-words"
                          title={exp.title}
                        >
                          {exp.title}
                        </h3>
                        {exp.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-300 font-normal line-clamp-1 mt-0.5 italic">
                            {exp.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="shrink-0 text-right pl-1 pt-0.5">
                      <div className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 whitespace-nowrap tracking-tight">
                        -{exp.amount.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Metadata Badges + Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                      {/* Category Pill */}
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                          border: `1px solid ${cat.color}30`
                        }}
                      >
                        {cat.label}
                      </span>

                      <span className="shrink-0 text-slate-500 dark:text-slate-300">
                        {exp.date}
                      </span>

                      <span className="text-slate-300 dark:text-slate-600 text-[10px] shrink-0">•</span>

                      <span className="truncate max-w-[85px] text-slate-600 dark:text-slate-300 font-medium" title={payerName}>
                        {payerName}
                      </span>

                      {linkedAsset && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600 text-[10px] shrink-0">•</span>
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 truncate max-w-[120px]"
                            title={linkedAsset}
                          >
                            📦 {linkedAsset}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition active:scale-95"
                          title="Chỉnh sửa chi tiêu"
                          aria-label="Chỉnh sửa chi tiêu"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id, exp.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition active:scale-95"
                          title="Xóa chi tiêu"
                          aria-label="Xóa chi tiêu"
                        >
                          <Trash2 size={14} />
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
          onClose={() => setShowBudgetModal(false)}
        />
      )}
    </div>
  );
};
