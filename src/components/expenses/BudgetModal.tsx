import React, { useState, useEffect, useMemo } from 'react';
import { X, Target, Save, ChevronLeft, ChevronRight, RotateCcw, Copy, Calendar, Info } from 'lucide-react';
import { useAppStore, getCurrentYearMonth } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface BudgetModalProps {
  onClose: () => void;
  initialMonth?: string; // 'YYYY-MM'
  onMonthChange?: (month: string) => void;
}

export function shiftYearMonth(ym: string, deltaMonths: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m - 1) + deltaMonths, 1);
  return getCurrentYearMonth(d);
}

export function formatYearMonthDisplay(ym: string): string {
  const [y, m] = ym.split('-');
  if (!y || !m) return ym;
  return `Tháng ${Number(m)}/${y}`;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  onClose,
  initialMonth,
  onMonthChange
}) => {
  const { budgets, expenses, updateBudget, resetMonthlyBudget, categories, settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const currentMonth = getCurrentYearMonth();
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || currentMonth);

  const buildLimitsForMonth = (monthKey: string) => {
    return Object.fromEntries(
      categories.map(cat => {
        const b = budgets.find(
          item => item.category === cat.id && (item.month || currentMonth) === monthKey
        );
        return [cat.id, b && b.monthlyLimit > 0 ? String(b.monthlyLimit) : ''];
      })
    );
  };

  const [limits, setLimits] = useState<Record<string, string>>(() =>
    buildLimitsForMonth(selectedMonth)
  );

  // Sync limits whenever selectedMonth changes
  useEffect(() => {
    setLimits(buildLimitsForMonth(selectedMonth));
  }, [selectedMonth, budgets, categories]);

  const handleSelectMonth = (nextMonth: string) => {
    if (!nextMonth) return;
    setSelectedMonth(nextMonth);
    if (onMonthChange) {
      onMonthChange(nextMonth);
    }
  };

  const handleLimitChange = (catId: string, val: string) => {
    const digits = val.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    setLimits(prev => ({ ...prev, [catId]: digits }));
  };

  const totalBudget = Object.values(limits).reduce((sum, str) => sum + (Number(str) || 0), 0);

  // Spent per category in selectedMonth
  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(exp => {
      if (exp.date.startsWith(selectedMonth)) {
        map[exp.category] = (map[exp.category] || 0) + exp.amount;
      }
    });
    return map;
  }, [expenses, selectedMonth]);

  const totalSpentInMonth = useMemo(() => {
    return Object.values(spentByCategory).reduce((sum, val) => sum + val, 0);
  }, [spentByCategory]);

  // Previous month budgets for optional quick copy
  const prevMonth = shiftYearMonth(selectedMonth, -1);
  const prevMonthBudgets = useMemo(() => {
    return budgets.filter(b => (b.month || currentMonth) === prevMonth && b.monthlyLimit > 0);
  }, [budgets, prevMonth, currentMonth]);

  const handleCopyPreviousMonth = () => {
    const nextLimits: Record<string, string> = {};
    categories.forEach(cat => {
      const prevB = prevMonthBudgets.find(b => b.category === cat.id);
      nextLimits[cat.id] = prevB && prevB.monthlyLimit > 0 ? String(prevB.monthlyLimit) : '';
    });
    setLimits(nextLimits);
  };

  const handleResetZero = () => {
    const emptyLimits = Object.fromEntries(categories.map(cat => [cat.id, '']));
    setLimits(emptyLimits);
    resetMonthlyBudget(selectedMonth);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    categories.forEach(cat => {
      const val = Number(limits[cat.id]) || 0;
      updateBudget(cat.id, val, selectedMonth);
    });
    onClose();
  };

  const isCurrentMonth = selectedMonth === currentMonth;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shrink-0">
              <Target size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Cài đặt hạn mức ngân sách theo tháng
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium truncate">
                Qua tháng mới hạn mức tự động reset về 0 để nhập lại
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          {/* Month Selector Bar */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleSelectMonth(shiftYearMonth(selectedMonth, -1))}
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 transition active:scale-95 shrink-0"
              title="Tháng trước"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex flex-col items-center justify-center min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <Calendar size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {formatYearMonthDisplay(selectedMonth)}
                </span>
                {isCurrentMonth ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Tháng này
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectMonth(currentMonth)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:underline"
                  >
                    Về tháng này
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium mt-0.5">
                Đã chi trong tháng: <strong className="text-rose-600 dark:text-rose-400">{totalSpentInMonth.toLocaleString('vi-VN')} đ</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleSelectMonth(shiftYearMonth(selectedMonth, 1))}
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 transition active:scale-95 shrink-0"
              title="Tháng tiếp theo"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Total Preview Card & Quick Reset / Copy Actions */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                Tổng ngân sách {formatYearMonthDisplay(selectedMonth).toLowerCase()}:
              </span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {totalBudget.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-emerald-200/60 dark:border-emerald-800/50">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1">
                <Info size={12} className="shrink-0" />
                <span>{totalBudget > 0 ? 'Đã thiết lập ngân sách' : 'Chưa đặt hạn mức (0 đ)'}</span>
              </span>

              <div className="flex items-center gap-1.5 ml-auto">
                {prevMonthBudgets.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyPreviousMonth}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 text-[11px] font-bold hover:bg-teal-50 dark:hover:bg-slate-700 transition active:scale-95"
                    title={`Sao chép hạn mức từ ${formatYearMonthDisplay(prevMonth)}`}
                  >
                    <Copy size={11} />
                    <span>Sao chép {formatYearMonthDisplay(prevMonth)}</span>
                  </button>
                )}

                {totalBudget > 0 && (
                  <button
                    type="button"
                    onClick={handleResetZero}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition active:scale-95"
                    title="Đặt lại toàn bộ hạn mức tháng này về 0"
                  >
                    <RotateCcw size={11} />
                    <span>Reset về 0</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Categories Budget Inputs */}
          <div className="space-y-2">
            {categories.map(cat => {
              const spent = spentByCategory[cat.id] || 0;
              const limitNum = Number(limits[cat.id]) || 0;
              const isOver = limitNum > 0 && spent > limitNum;

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg shrink-0">{cat.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                        {cat.name}
                      </div>
                      <div className={`text-[10px] font-medium truncate ${
                        isOver
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-slate-500 dark:text-slate-300'
                      }`}>
                        Đã chi: {spent.toLocaleString('vi-VN')} đ
                        {isOver ? ' (Vượt mức!)' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="relative w-36 sm:w-44 shrink-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={limits[cat.id] ? Number(limits[cat.id]).toLocaleString('vi-VN') : ''}
                      onChange={e => handleLimitChange(cat.id, e.target.value)}
                      className="w-full py-1.5 px-3 pr-7 text-right font-bold text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-base sm:text-xs"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-semibold text-slate-500 dark:text-slate-300 text-[11px] pointer-events-none">
                      đ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {t('action_cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Save size={16} />
              <span>Lưu {formatYearMonthDisplay(selectedMonth)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
