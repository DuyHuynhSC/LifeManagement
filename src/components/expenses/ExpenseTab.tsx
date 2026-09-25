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
  QrCode
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

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  // Category labels and colors
  const categoryConfig: Record<ExpenseCategory, { label: string; color: string }> = {
    food: { label: t('cat_food'), color: '#10b981' },
    utilities: { label: t('cat_utilities'), color: '#3b82f6' },
    appliances: { label: t('cat_appliances'), color: '#8b5cf6' },
    maintenance: { label: t('cat_maintenance'), color: '#f59e0b' },
    healthcare: { label: t('cat_healthcare'), color: '#ef4444' },
    education: { label: t('cat_education'), color: '#ec4899' },
    entertainment: { label: t('cat_entertainment'), color: '#06b6d4' },
    other: { label: t('cat_other'), color: '#64748b' },
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

  // Filtered transactions
  const filteredExpenses = selectedCategoryFilter === 'all'
    ? expenses
    : expenses.filter(e => e.category === selectedCategoryFilter);

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
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {t('expense_history')} ({filteredExpenses.length})
          </h2>

          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="text-[11px] p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">Tất cả danh mục</option>
            {Object.entries(categoryConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
            <Wallet size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold">Chưa có giao dịch chi tiêu nào.</p>
            <p className="text-[11px]">Bấm "+ Thêm" hoặc dùng giọng nói để ghi lại khoản chi của bạn.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.map(exp => {
              const cat = categoryConfig[exp.category] || categoryConfig.other;
              const payerName = userMap[exp.payerId] || exp.payerId;
              const linkedAsset = exp.assetId ? assetMap[exp.assetId] : null;

              return (
                <div
                  key={exp.id}
                  className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 shadow-sm"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <Wallet size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {exp.title}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{exp.date}</span>
                        <span>•</span>
                        <span>{payerName}</span>
                        {linkedAsset && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[100px]">
                              {linkedAsset}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        -{exp.amount.toLocaleString('vi-VN')} đ
                      </div>
                      <div className="text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                        {cat.label}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                          title="Chỉnh sửa chi tiêu"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id, exp.title)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Xóa chi tiêu"
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
