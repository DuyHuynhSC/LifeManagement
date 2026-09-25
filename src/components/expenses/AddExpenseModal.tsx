import React, { useState } from 'react';
import { X, Wallet, Mic, Plus, Pencil, QrCode } from 'lucide-react';
import { ExpenseCategory, Expense } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface AddExpenseModalProps {
  onClose: () => void;
  onOpenVoiceInput?: () => void;
  onOpenQRScanner?: () => void;
  prefillCategory?: ExpenseCategory;
  prefillAmount?: number;
  prefillTitle?: string;
  expenseToEdit?: Expense;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  onClose,
  onOpenVoiceInput,
  onOpenQRScanner,
  prefillCategory,
  prefillAmount,
  prefillTitle,
  expenseToEdit
}) => {
  const { addExpense, updateExpense, assets, users, currentUser, settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const [title, setTitle] = useState(expenseToEdit?.title || prefillTitle || '');
  const [amountStr, setAmountStr] = useState<string>(
    expenseToEdit ? String(expenseToEdit.amount) : (prefillAmount ? String(prefillAmount) : '')
  );
  const [category, setCategory] = useState<ExpenseCategory>(expenseToEdit?.category || prefillCategory || 'food');
  const [date, setDate] = useState(expenseToEdit?.date || new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState(expenseToEdit?.payerId || currentUser.id);
  const [assetId, setAssetId] = useState(expenseToEdit?.assetId || '');
  const [notes, setNotes] = useState(expenseToEdit?.notes || '');

  const categories: { id: ExpenseCategory; label: string; icon: string }[] = [
    { id: 'food', label: t('cat_food'), icon: '🍔' },
    { id: 'utilities', label: t('cat_utilities'), icon: '💡' },
    { id: 'appliances', label: t('cat_appliances'), icon: '📺' },
    { id: 'maintenance', label: t('cat_maintenance'), icon: '🔧' },
    { id: 'healthcare', label: t('cat_healthcare'), icon: '💊' },
    { id: 'education', label: t('cat_education'), icon: '📚' },
    { id: 'entertainment', label: t('cat_entertainment'), icon: '🎬' },
    { id: 'other', label: t('cat_other'), icon: '📦' },
  ];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ giữ lại các chữ số
    const digits = e.target.value.replace(/\D/g, '');
    // Bỏ số 0 thừa ở đầu nếu có chữ số khác theo sau (VD: '08208000' -> '8208000')
    const cleaned = digits.replace(/^0+(?=\d)/, '');
    setAmountStr(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amountStr);
    if (!title.trim() || !numAmount || numAmount <= 0) return;

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, {
        title: title.trim(),
        amount: numAmount,
        category,
        date,
        payerId,
        assetId: assetId || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      addExpense({
        title: title.trim(),
        amount: numAmount,
        category,
        date,
        payerId,
        assetId: assetId || undefined,
        notes: notes.trim() || undefined
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              {expenseToEdit ? <Pencil size={20} /> : <Wallet size={20} />}
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {expenseToEdit ? 'Chỉnh sửa chi tiêu' : t('expense_add_new')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                {expenseToEdit ? 'Cập nhật thông tin khoản chi tiêu' : 'Ghi nhận khoản chi tiêu gia đình'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Quick Helpers (Voice & QR Scan) */}
          {!expenseToEdit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {onOpenVoiceInput && (
                <button
                  type="button"
                  onClick={onOpenVoiceInput}
                  className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300 font-bold transition hover:bg-purple-100"
                >
                  <Mic size={16} />
                  <span>Nói để điền tự động</span>
                </button>
              )}
              {onOpenQRScanner && (
                <button
                  type="button"
                  onClick={onOpenQRScanner}
                  className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 font-bold transition hover:bg-amber-100"
                >
                  <QrCode size={16} />
                  <span>Quét QR / Hóa đơn</span>
                </button>
              )}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Số tiền chi (đ) *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={amountStr ? Number(amountStr).toLocaleString('vi-VN') : ''}
                onChange={handleAmountChange}
                className="w-full p-3 pr-10 text-lg font-extrabold text-emerald-600 dark:text-emerald-400 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm pointer-events-none">
                đ
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Mô tả nội dung chi *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Mua rau quả, Tiền điện, Cà phê sáng..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              {t('expense_category')}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {categories.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-[10px] leading-tight text-center truncate w-full">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('expense_date')}
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('expense_payer')}
              </label>
              <select
                value={payerId}
                onChange={e => setPayerId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.avatar} {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Link to Asset (Tùy chọn) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {t('expense_link_asset')}
            </label>
            <select
              value={assetId}
              onChange={e => setAssetId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
            >
              <option value="">-- Không gắn thiết bị --</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.room})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Ghi chú thêm
            </label>
            <input
              type="text"
              placeholder="Chi tiết địa điểm mua, người cùng tham gia..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
            />
          </div>

          {/* Submit */}
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
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl shadow-md transition"
            >
              {expenseToEdit ? t('action_save') : t('action_add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
