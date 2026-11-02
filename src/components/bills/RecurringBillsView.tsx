import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Pencil, 
  Trash2, 
  CreditCard, 
  Sparkles, 
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
  Zap,
  X
} from 'lucide-react';
import { RecurringBill, BillFrequency } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { AddRecurringBillModal } from './AddRecurringBillModal';

interface RecurringBillsViewProps {
  onOpenAddModal?: () => void;
}

export const RecurringBillsView: React.FC<RecurringBillsViewProps> = () => {
  const { 
    recurringBills, 
    payRecurringBill, 
    deleteRecurringBill, 
    categories, 
    users, 
    settings, 
    currentUser 
  } = useAppStore();

  const [filterCycle, setFilterCycle] = useState<'all' | BillFrequency>('all');
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // State modal xác nhận thanh toán 1 chạm
  const [payingBill, setPayingBill] = useState<RecurringBill | null>(null);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paidDate, setPaidDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tính toán trạng thái của từng hóa đơn:
  // - overdue: nextDueDate < today
  // - dueSoon: nextDueDate >= today && nextDueDate <= today + 5 days
  // - upcoming: nextDueDate > today + 5 days
  const billsWithStatus = useMemo(() => {
    return recurringBills.map(b => {
      const due = new Date(b.nextDueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let status: 'overdue' | 'due_soon' | 'upcoming' = 'upcoming';
      if (diffDays < 0) {
        status = 'overdue';
      } else if (diffDays <= (settings.notifyDaysBeforeExpiry || 5)) {
        status = 'due_soon';
      }

      return {
        ...b,
        diffDays,
        status
      };
    });
  }, [recurringBills, settings.notifyDaysBeforeExpiry]);

  // Tổng tiền hóa đơn hàng tháng ước tính
  const monthlyTotal = useMemo(() => {
    return recurringBills.reduce((sum, b) => {
      if (b.billingCycle === 'monthly') return sum + b.amount;
      if (b.billingCycle === 'quarterly') return sum + Math.round(b.amount / 3);
      if (b.billingCycle === 'yearly') return sum + Math.round(b.amount / 12);
      return sum + b.amount;
    }, 0);
  }, [recurringBills]);

  // Thống kê hóa đơn cần xử lý
  const overdueCount = billsWithStatus.filter(b => b.status === 'overdue').length;
  const dueSoonCount = billsWithStatus.filter(b => b.status === 'due_soon').length;

  const filteredBills = billsWithStatus.filter(b => {
    if (filterCycle === 'all') return true;
    return b.billingCycle === filterCycle;
  }).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());

  const handleStartPay = (bill: RecurringBill) => {
    setPayingBill(bill);
    setPaidAmount(String(bill.amount));
    setPaidDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmPay = () => {
    if (!payingBill) return;
    const finalAmount = Math.max(0, Number(paidAmount.replace(/[^0-9]/g, '')) || payingBill.amount);

    const res = payRecurringBill(payingBill.id, finalAmount, paidDate);
    if (res) {
      setPaySuccessMsg(`Đã thanh toán "${payingBill.title}" (${finalAmount.toLocaleString()} ₫)! Tự động tạo chi tiêu & nhận +25 XP!`);
      setTimeout(() => setPaySuccessMsg(null), 4000);
    }
    setPayingBill(null);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa hóa đơn định kỳ "${title}"?`)) {
      deleteRecurringBill(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast thông báo thanh toán thành công */}
      {paySuccessMsg && (
        <div className="p-3 bg-teal-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
          <Sparkles size={16} />
          <span>{paySuccessMsg}</span>
        </div>
      )}

      {/* Hero Card: Thống kê Hóa đơn Định kỳ */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-teal-500/30 relative overflow-hidden space-y-3">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-teal-200 uppercase tracking-wider block">
              Tổng chi phí định kỳ ước tính / tháng
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono tabular-nums mt-0.5">
              {monthlyTotal.toLocaleString('vi-VN')} <span className="text-xs font-bold font-sans text-teal-300">đ/tháng</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-teal-100">
              <span>{recurringBills.length} khoản định kỳ</span>
              <span>•</span>
              <span className="font-medium">Tự động lùi kỳ sau khi trả</span>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-white text-teal-900 font-bold rounded-xl text-xs shadow-md hover:bg-teal-50 active:scale-95 transition flex items-center gap-1.5 shrink-0"
          >
            <Plus size={15} />
            <span>Thêm hóa đơn</span>
          </button>
        </div>

        {/* Status badges */}
        <div className="relative z-10 grid grid-cols-2 gap-2 pt-2 border-t border-teal-600/50 text-xs">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur flex items-center justify-between">
            <span className="text-teal-200 text-[11px]">Sắp đến hạn (5 ngày):</span>
            <span className={`font-black font-mono px-2 py-0.5 rounded-full ${dueSoonCount > 0 ? 'bg-amber-400 text-slate-900 animate-pulse' : 'bg-white/20'}`}>
              {dueSoonCount}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white/10 backdrop-blur flex items-center justify-between">
            <span className="text-teal-200 text-[11px]">Quá hạn:</span>
            <span className={`font-black font-mono px-2 py-0.5 rounded-full ${overdueCount > 0 ? 'bg-rose-500 text-white animate-bounce' : 'bg-white/20'}`}>
              {overdueCount}
            </span>
          </div>
        </div>

        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Filter Chips: Chu kỳ */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterCycle('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${filterCycle === 'all'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tất cả ({recurringBills.length})
          </button>
          <button
            onClick={() => setFilterCycle('monthly')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${filterCycle === 'monthly'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Hàng tháng
          </button>
          <button
            onClick={() => setFilterCycle('quarterly')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${filterCycle === 'quarterly'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Hàng quý
          </button>
          <button
            onClick={() => setFilterCycle('yearly')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${filterCycle === 'yearly'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Hàng năm
          </button>
        </div>
      </div>

      {/* Danh sách Hóa đơn */}
      <div className="space-y-2.5">
        {filteredBills.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
            <Calendar size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">
              Chưa có hóa đơn định kỳ nào.
            </p>
            <p className="text-[11px] text-slate-400">
              Bấm "+ Thêm hóa đơn" để quản lý các khoản chi cố định hàng tháng!
            </p>
          </div>
        ) : (
          filteredBills.map(bill => {
            const cat = categoryMap[bill.category];
            const payer = userMap[bill.payerId];
            const isOverdue = bill.status === 'overdue';
            const isDueSoon = bill.status === 'due_soon';

            return (
              <div
                key={bill.id}
                className={`p-3.5 bg-white dark:bg-slate-800 rounded-2xl border transition-all shadow-xs space-y-2.5 ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
                    : isDueSoon
                    ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20'
                    : 'border-slate-200 dark:border-slate-700/80 hover:border-teal-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center text-lg shrink-0 border border-teal-200/50">
                      {cat?.icon || '🧾'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {bill.title}
                        </h3>
                        {bill.isAutoPaid && (
                          <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-md">
                            Tự động trích nợ
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        {bill.provider && <span className="font-semibold text-slate-700 dark:text-slate-300">{bill.provider}</span>}
                        {bill.provider && <span>•</span>}
                        <span>{bill.billingCycle === 'monthly' ? 'Hàng tháng' : bill.billingCycle === 'quarterly' ? 'Hàng quý' : 'Hàng năm'} (ngày {bill.dueDay})</span>
                      </div>
                    </div>
                  </div>

                  {/* Giá tiền */}
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums">
                      {bill.amount.toLocaleString('vi-VN')} ₫
                    </div>
                    {/* Badge trạng thái ngày */}
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.2 rounded">
                        <AlertTriangle size={10} /> Quá hạn {Math.abs(bill.diffDays)} ngày
                      </span>
                    ) : isDueSoon ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.2 rounded animate-pulse">
                        <Clock size={10} /> Đến hạn sau {bill.diffDays} ngày
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                        Hạn: {bill.nextDueDate}
                      </span>
                    )}
                  </div>
                </div>

                {bill.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl italic">
                    {bill.notes}
                  </p>
                )}

                {/* Footer Actions: Thanh toán 1 chạm & Sửa/Xóa */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>Phụ trách: </span>
                    <strong className="text-slate-600 dark:text-slate-300 font-semibold">{payer?.name || 'Gia đình'}</strong>
                    {bill.lastPaidDate && (
                      <>
                        <span>•</span>
                        <span>Đã trả gần nhất: {bill.lastPaidDate}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingBill(bill)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Sửa hóa đơn"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(bill.id, bill.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Xóa hóa đơn"
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Nút Thanh toán 1 chạm */}
                    <button
                      onClick={() => handleStartPay(bill)}
                      className="flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs transition"
                      title="Xác nhận thanh toán và tự động ghi vào Chi tiêu"
                    >
                      <Check size={13} />
                      <span>Đã thanh toán</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal xác nhận thanh toán 1 chạm */}
      {payingBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Xác nhận thanh toán
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {payingBill.title}
                  </p>
                </div>
              </div>
              <button onClick={() => setPayingBill(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Số tiền thực đóng (₫) *
                </label>
                <input
                  type="text"
                  required
                  value={paidAmount ? Number(paidAmount.replace(/[^0-9]/g, '')).toLocaleString('vi-VN') : ''}
                  onChange={e => setPaidAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-base text-teal-600 dark:text-teal-400 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Ngày thanh toán
                </label>
                <input
                  type="date"
                  required
                  value={paidDate}
                  onChange={e => setPaidDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none font-medium"
                />
              </div>

              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800/60 text-[11px] text-teal-800 dark:text-teal-300 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <Sparkles size={14} className="text-teal-500" />
                  <span>Hệ thống sẽ tự động:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-teal-700 dark:text-teal-400">
                  <li>Thêm giao dịch vào <strong>Quản lý Chi tiêu</strong></li>
                  <li>Cập nhật ngày đến hạn tiếp theo</li>
                  <li>Thưởng <strong>+25 XP</strong> cho người phụ trách!</li>
                </ul>
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayingBill(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPay}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md transition"
                >
                  Xác nhận đóng tiền
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm / Sửa Hóa đơn */}
      {showAddModal && (
        <AddRecurringBillModal
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingBill && (
        <AddRecurringBillModal
          billToEdit={editingBill}
          onClose={() => setEditingBill(null)}
        />
      )}
    </div>
  );
};
