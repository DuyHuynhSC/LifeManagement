import React, { useState } from 'react';
import { X, Calendar, DollarSign, Building2, Tag, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { RecurringBill, BillFrequency } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface AddRecurringBillModalProps {
  onClose: () => void;
  billToEdit?: RecurringBill | null;
}

export const AddRecurringBillModal: React.FC<AddRecurringBillModalProps> = ({
  onClose,
  billToEdit
}) => {
  const { categories, users, currentUser, settings, addRecurringBill, updateRecurringBill } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const [title, setTitle] = useState(billToEdit?.title || '');
  const [amount, setAmount] = useState(billToEdit?.amount ? String(billToEdit.amount) : '');
  const [category, setCategory] = useState(billToEdit?.category || 'utilities');
  const [billingCycle, setBillingCycle] = useState<BillFrequency>(billToEdit?.billingCycle || 'monthly');
  const [dueDay, setDueDay] = useState(billToEdit?.dueDay || 15);
  const [nextDueDate, setNextDueDate] = useState(() => {
    if (billToEdit?.nextDueDate) return billToEdit.nextDueDate;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}-15`;
  });
  const [isAutoPaid, setIsAutoPaid] = useState(Boolean(billToEdit?.isAutoPaid));
  const [payerId, setPayerId] = useState(billToEdit?.payerId || currentUser.id);
  const [provider, setProvider] = useState(billToEdit?.provider || '');
  const [notes, setNotes] = useState(billToEdit?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const numAmount = Math.max(0, Number(amount.replace(/[^0-9]/g, '')) || 0);

    if (billToEdit) {
      updateRecurringBill(billToEdit.id, {
        title: title.trim(),
        amount: numAmount,
        category,
        billingCycle,
        dueDay: Number(dueDay),
        nextDueDate,
        isAutoPaid,
        payerId,
        provider: provider.trim(),
        notes: notes.trim()
      });
    } else {
      addRecurringBill({
        title: title.trim(),
        amount: numAmount,
        category,
        billingCycle,
        dueDay: Number(dueDay),
        nextDueDate,
        isAutoPaid,
        payerId,
        provider: provider.trim(),
        notes: notes.trim()
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {billToEdit ? 'Chỉnh sửa Hóa đơn định kỳ' : 'Thêm Hóa đơn định kỳ mới'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Theo dõi điện, nước, internet, học phí, netflix...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Tên hóa đơn & Nhà cung cấp */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-200">
              Tên hóa đơn / Dịch vụ *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Tiền điện EVN, Internet Viettel, Phí chung cư..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Nhà cung cấp */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Đơn vị cung cấp
              </label>
              <input
                type="text"
                placeholder="VD: EVN, Viettel, Netflix..."
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            {/* Số tiền dự kiến */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Số tiền dự kiến (₫) *
              </label>
              <input
                type="text"
                required
                placeholder="0"
                value={amount ? Number(amount.replace(/[^0-9]/g, '')).toLocaleString('vi-VN') : ''}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono text-teal-600 dark:text-teal-400"
              />
            </div>
          </div>

          {/* Chu kỳ & Hạn đóng trong tháng */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Chu kỳ thanh toán
              </label>
              <select
                value={billingCycle}
                onChange={e => setBillingCycle(e.target.value as BillFrequency)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-medium"
              >
                <option value="monthly">Hàng tháng (Monthly)</option>
                <option value="quarterly">Hàng quý (3 tháng/lần)</option>
                <option value="yearly">Hàng năm (Yearly)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Hạn đóng (Ngày trong tháng)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={e => {
                  const val = Math.min(31, Math.max(1, Number(e.target.value) || 1));
                  setDueDay(val);
                  // Cập nhật ngày tiếp theo theo day mới
                  const parts = nextDueDate.split('-');
                  if (parts.length === 3) {
                    setNextDueDate(`${parts[0]}-${parts[1]}-${String(val).padStart(2, '0')}`);
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-bold text-center"
              />
            </div>
          </div>

          {/* Ngày đến hạn kỳ tới & Danh mục */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Hạn thanh toán kỳ tới
              </label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={e => setNextDueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Nhóm chi tiêu
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-medium"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Người phụ trách & Tự động trích nợ */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Người chịu trách nhiệm
              </label>
              <select
                value={payerId}
                onChange={e => setPayerId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-medium"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.avatar} {u.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAutoPaid}
                  onChange={e => setIsAutoPaid(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  Tự động trích nợ ngân hàng
                </span>
              </label>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-200">
              Ghi chú / Mã khách hàng / Số hợp đồng
            </label>
            <input
              type="text"
              placeholder="VD: Mã KH: PD04001294829, Trừ thẻ tín dụng Techcombank..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-medium"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>{billToEdit ? 'Lưu thay đổi' : 'Thêm hóa đơn (+15 XP)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
