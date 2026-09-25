import React, { useState } from 'react';
import { X, Target, Save } from 'lucide-react';
import { ExpenseCategory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface BudgetModalProps {
  onClose: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ onClose }) => {
  const { budgets, updateBudget, settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const categoryConfig: { id: ExpenseCategory; label: string; icon: string }[] = [
    { id: 'food', label: t('cat_food'), icon: '🍔' },
    { id: 'utilities', label: t('cat_utilities'), icon: '💡' },
    { id: 'appliances', label: t('cat_appliances'), icon: '📺' },
    { id: 'maintenance', label: t('cat_maintenance'), icon: '🔧' },
    { id: 'healthcare', label: t('cat_healthcare'), icon: '💊' },
    { id: 'education', label: t('cat_education'), icon: '📚' },
    { id: 'entertainment', label: t('cat_entertainment'), icon: '🎬' },
    { id: 'other', label: t('cat_other'), icon: '📦' },
  ];

  // Map initial values
  const [limits, setLimits] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    categoryConfig.forEach(cat => {
      const b = budgets.find(item => item.category === cat.id);
      map[cat.id] = b && b.monthlyLimit > 0 ? String(b.monthlyLimit) : '';
    });
    return map;
  });

  const handleLimitChange = (catId: string, val: string) => {
    const digits = val.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    setLimits(prev => ({ ...prev, [catId]: digits }));
  };

  const totalBudget = Object.values(limits).reduce((sum, str) => sum + (Number(str) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    categoryConfig.forEach(cat => {
      const val = Number(limits[cat.id]) || 0;
      updateBudget(cat.id, val);
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
              <Target size={20} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Cài đặt hạn mức ngân sách
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                Thiết lập ngân sách chi tiêu hàng tháng theo nhóm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          {/* Total Preview Card */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3 flex items-center justify-between">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">
              Tổng ngân sách tháng:
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {totalBudget.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="space-y-2">
            {categoryConfig.map(cat => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 gap-2"
              >
                <div className="flex items-center gap-2 min-w-[130px]">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    {cat.label}
                  </span>
                </div>
                <div className="relative flex-1 max-w-[170px]">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={limits[cat.id] ? Number(limits[cat.id]).toLocaleString('vi-VN') : ''}
                    onChange={e => handleLimitChange(cat.id, e.target.value)}
                    className="w-full py-1.5 px-3 pr-7 text-right font-bold text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 font-semibold text-slate-400 text-[11px] pointer-events-none">
                    đ
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200"
            >
              {t('action_cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Save size={16} />
              <span>{t('action_save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
