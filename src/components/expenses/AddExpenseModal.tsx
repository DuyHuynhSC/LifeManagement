import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Wallet, Mic, Plus, Pencil, QrCode, Sparkles, Clock } from 'lucide-react';
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
  const { addExpense, updateExpense, assets, users, currentUser, settings, expenses } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const [title, setTitle] = useState(expenseToEdit?.title || prefillTitle || '');
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const titleContainerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (titleContainerRef.current && !titleContainerRef.current.contains(e.target as Node)) {
        setShowTitleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryInfo = (catId: ExpenseCategory) => {
    return categories.find(c => c.id === catId) || { id: 'other' as ExpenseCategory, label: t('cat_other'), icon: '📦' };
  };

  interface TitleSuggestion {
    title: string;
    category: ExpenseCategory;
    typicalAmount?: number;
    count: number;
  }

  const pastTitleSuggestions = useMemo<TitleSuggestion[]>(() => {
    const map = new Map<string, TitleSuggestion>();

    // Tiêu chuẩn mặc định chi tiêu sinh hoạt phổ biến
    const defaults: { title: string; category: ExpenseCategory; typicalAmount?: number }[] = [
      { title: 'Cà phê sáng', category: 'food', typicalAmount: 25000 },
      { title: 'Ăn sáng', category: 'food', typicalAmount: 35000 },
      { title: 'Ăn trưa', category: 'food', typicalAmount: 50000 },
      { title: 'Ăn tối', category: 'food', typicalAmount: 60000 },
      { title: 'Đi chợ / Siêu thị', category: 'food', typicalAmount: 150000 },
      { title: 'Tiền điện', category: 'utilities' },
      { title: 'Tiền nước', category: 'utilities' },
      { title: 'Tiền mạng Internet', category: 'utilities' },
      { title: 'Xăng xe', category: 'other', typicalAmount: 50000 },
      { title: 'Thuốc men', category: 'healthcare' },
      { title: 'Học tập & Sách vở', category: 'education' },
      { title: 'Xem phim / Giải trí', category: 'entertainment', typicalAmount: 120000 },
      { title: 'Mua sắm đồ gia dụng', category: 'appliances' },
      { title: 'Bảo trì linh kiện', category: 'maintenance' },
    ];

    // Ưu tiên 1: Lấy từ lịch sử chi tiêu thực tế của người dùng
    if (expenses && expenses.length > 0) {
      for (const exp of expenses) {
        const trimmed = exp.title?.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (map.has(key)) {
          const item = map.get(key)!;
          item.count += 1;
        } else {
          map.set(key, {
            title: trimmed,
            category: exp.category,
            typicalAmount: exp.amount,
            count: 1,
          });
        }
      }
    }

    // Ưu tiên 2: Thêm các mục gợi ý mặc định nếu chưa có
    for (const d of defaults) {
      const key = d.title.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          title: d.title,
          category: d.category,
          typicalAmount: d.typicalAmount,
          count: 0,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [expenses]);

  const removeAccents = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredTitleSuggestions = useMemo(() => {
    const q = title.trim();
    if (!q) {
      return pastTitleSuggestions.slice(0, 5);
    }
    const qLower = q.toLowerCase();
    const qNorm = removeAccents(q);

    return pastTitleSuggestions
      .filter(item => {
        const tLower = item.title.toLowerCase();
        const tNorm = removeAccents(item.title);
        return tLower.includes(qLower) || tNorm.includes(qNorm);
      })
      .slice(0, 6);
  }, [title, pastTitleSuggestions]);

  const handleSelectTitleSuggestion = (item: TitleSuggestion) => {
    setTitle(item.title);
    setCategory(item.category);
    if ((!amountStr || amountStr === '0') && item.typicalAmount) {
      setAmountStr(String(item.typicalAmount));
    }
    setShowTitleDropdown(false);
  };

  const amountSuggestions = useMemo(() => {
    const num = Number(amountStr.replace(/\D/g, ''));
    if (!num || num <= 0) {
      return [
        { value: 20000, label: '20k' },
        { value: 50000, label: '50k' },
        { value: 100000, label: '100k' },
        { value: 200000, label: '200k' },
        { value: 500000, label: '500k' },
      ];
    }

    const formatShort = (val: number) => {
      if (val < 1_000_000) {
        return `${Math.round(val / 1000)}k`;
      }
      const tr = val / 1_000_000;
      return `${Number.isInteger(tr) ? tr : tr.toFixed(1)} tr`;
    };

    const results: { value: number; label: string }[] = [];
    let multipliers: number[] = [];

    if (num < 10) {
      multipliers = [1_000, 10_000, 100_000, 1_000_000];
    } else if (num < 100) {
      // VD: nhập 27 -> 27.000 (27k), 270.000 (270k), 2.700.000 (2.7 tr), 27.000.000 (27 tr)
      multipliers = [1_000, 10_000, 100_000, 1_000_000];
    } else if (num < 1_000) {
      // VD: nhập 150 -> 150.000 (150k), 1.500.000 (1.5 tr), 15.000.000 (15 tr)
      multipliers = [1_000, 10_000, 100_000];
    } else if (num < 10_000) {
      multipliers = [1_000, 10_000];
    } else if (num < 100_000) {
      multipliers = [10, 100];
    }

    for (const m of multipliers) {
      const val = num * m;
      if (val <= 500_000_000 && !results.some(r => r.value === val)) {
        results.push({
          value: val,
          label: formatShort(val)
        });
      }
    }

    return results.slice(0, 4);
  }, [amountStr]);

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

          {/* Amount Field with Quick Multiplier Suggestions */}
          <div className="relative z-10">
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

            {/* Quick Amount Suggestion Chips */}
            {amountSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2 animate-in fade-in duration-150">
                <span className="text-[11px] text-slate-500 dark:text-slate-300 font-medium flex items-center gap-1 mr-0.5">
                  <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
                  Gợi ý:
                </span>
                {amountSuggestions.map(sug => (
                  <button
                    key={sug.value}
                    type="button"
                    onClick={() => setAmountStr(String(sug.value))}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                    <span>{sug.value.toLocaleString('vi-VN')} đ</span>
                    <span className="text-[10px] font-normal opacity-75">
                      ({sug.label})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title Field with Dropdown Suggestions */}
          <div className="relative z-20" ref={titleContainerRef}>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Mô tả nội dung chi *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="VD: Mua rau quả, Tiền điện, Cà phê sáng..."
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  setShowTitleDropdown(true);
                }}
                onFocus={() => setShowTitleDropdown(true)}
                className="w-full p-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              {filteredTitleSuggestions.length > 0 && !showTitleDropdown && !title && (
                <button
                  type="button"
                  onClick={() => setShowTitleDropdown(true)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                  title="Xem gợi ý chi tiêu"
                >
                  <Sparkles size={14} />
                </button>
              )}
            </div>

            {/* Title Suggestions Dropdown */}
            {showTitleDropdown && filteredTitleSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-30 max-h-56 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-emerald-600 dark:text-emerald-400" />
                    {title.trim() ? 'Gợi ý phù hợp' : 'Chi tiêu gần đây / Phổ biến'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-normal">Chạm để chọn</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredTitleSuggestions.map((item, idx) => {
                    const catInfo = getCategoryInfo(item.category);
                    return (
                      <button
                        key={`${item.title}-${idx}`}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handleSelectTitleSuggestion(item)}
                        className="w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-emerald-50/70 dark:hover:bg-slate-700/80 transition group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{catInfo.icon}</span>
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {item.typicalAmount && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              ~{item.typicalAmount.toLocaleString('vi-VN')} đ
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            {catInfo.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
