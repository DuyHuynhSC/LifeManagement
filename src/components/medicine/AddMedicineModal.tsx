import React, { useState } from 'react';
import { X, Pill, Calendar, MapPin, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { MedicineItem, MedicineCategory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface AddMedicineModalProps {
  onClose: () => void;
  medicineToEdit?: MedicineItem | null;
}

export const MEDICINE_CATEGORY_LABELS: Record<MedicineCategory, { label: string; icon: string; color: string }> = {
  fever_pain: { label: 'Hạ sốt & Giảm đau', icon: '🌡️', color: '#ef4444' },
  digestive: { label: 'Tiêu hóa & Dạ dày', icon: '🍵', color: '#f59e0b' },
  respiratory: { label: 'Hô hấp & Cảm cúm', icon: '🫁', color: '#3b82f6' },
  allergy: { label: 'Chống Dị ứng', icon: '🌿', color: '#10b981' },
  first_aid: { label: 'Sơ cứu & Băng gạc', icon: '🩹', color: '#8b5cf6' },
  supplements: { label: 'Vitamin & Bổ sung', icon: '✨', color: '#ec4899' },
  other: { label: 'Thuốc / Dược phẩm khác', icon: '💊', color: '#64748b' }
};

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  onClose,
  medicineToEdit
}) => {
  const { settings, addMedicineItem, updateMedicineItem } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const [name, setName] = useState(medicineToEdit?.name || '');
  const [category, setCategory] = useState<MedicineCategory>(medicineToEdit?.category || 'fever_pain');
  const [quantity, setQuantity] = useState(medicineToEdit?.quantity !== undefined ? String(medicineToEdit.quantity) : '10');
  const [unit, setUnit] = useState(medicineToEdit?.unit || 'viên');
  const [expiryDate, setExpiryDate] = useState(() => {
    if (medicineToEdit?.expiryDate) return medicineToEdit.expiryDate;
    const now = new Date();
    now.setFullYear(now.getFullYear() + 1);
    return now.toISOString().split('T')[0];
  });
  const [dosageInstructions, setDosageInstructions] = useState(medicineToEdit?.dosageInstructions || '');
  const [storageLocation, setStorageLocation] = useState(medicineToEdit?.storageLocation || 'Tủ thuốc phòng khách');
  const [minQuantityAlert, setMinQuantityAlert] = useState(medicineToEdit?.minQuantityAlert !== undefined ? String(medicineToEdit.minQuantityAlert) : '2');
  const [notes, setNotes] = useState(medicineToEdit?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numQty = Math.max(0, Number(quantity) || 0);
    const numMin = Math.max(0, Number(minQuantityAlert) || 0);

    if (medicineToEdit) {
      updateMedicineItem(medicineToEdit.id, {
        name: name.trim(),
        category,
        quantity: numQty,
        unit: unit.trim() || 'viên',
        expiryDate,
        dosageInstructions: dosageInstructions.trim(),
        storageLocation: storageLocation.trim(),
        minQuantityAlert: numMin,
        notes: notes.trim()
      });
    } else {
      addMedicineItem({
        name: name.trim(),
        category,
        quantity: numQty,
        unit: unit.trim() || 'viên',
        expiryDate,
        dosageInstructions: dosageInstructions.trim(),
        storageLocation: storageLocation.trim(),
        minQuantityAlert: numMin,
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
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Pill size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {medicineToEdit ? 'Chỉnh sửa thông tin Thuốc' : 'Thêm Thuốc vào Tủ gia đình'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Theo dõi hạn sử dụng, số lượng và liều dùng
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
          {/* Tên thuốc & Nhóm công dụng */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-200">
              Tên thuốc / Dược phẩm *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Paracetamol 500mg, Oresol 245, Siro ho..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-200">
              Nhóm công dụng *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as MedicineCategory)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-medium"
            >
              {Object.entries(MEDICINE_CATEGORY_LABELS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.icon} {val.label}
                </option>
              ))}
            </select>
          </div>

          {/* Số lượng, Đơn vị & Ngưỡng báo hết */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Số lượng *
              </label>
              <input
                type="number"
                min={0}
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-bold text-center"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Đơn vị
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-medium"
              >
                <option value="viên">viên</option>
                <option value="vỉ">vỉ</option>
                <option value="gói">gói</option>
                <option value="chai">chai</option>
                <option value="lọ">lọ</option>
                <option value="tuýp">tuýp</option>
                <option value="hộp">hộp</option>
                <option value="miếng">miếng</option>
                <option value="ống">ống</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200 truncate block" title="Báo động khi <= số lượng này">
                Báo khi &le;
              </label>
              <input
                type="number"
                min={0}
                value={minQuantityAlert}
                onChange={e => setMinQuantityAlert(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-bold text-center text-amber-600"
              />
            </div>
          </div>

          {/* Hạn sử dụng & Vị trí cất */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Hạn sử dụng (Exp Date) *
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                Vị trí cất giữ
              </label>
              <input
                type="text"
                placeholder="VD: Tủ thuốc phòng khách, ngăn bếp..."
                value={storageLocation}
                onChange={e => setStorageLocation(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-medium"
              />
            </div>
          </div>

          {/* Hướng dẫn liều dùng */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-200">
              Liều dùng & Chỉ định quan trọng
            </label>
            <textarea
              rows={2}
              placeholder="VD: Người lớn 1-2 viên/lần khi sốt > 38.5°C, cách 4-6 tiếng. Uống sau ăn..."
              value={dosageInstructions}
              onChange={e => setDosageInstructions(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white outline-none font-medium"
            />
          </div>

          {/* Ghi chú thêm */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-200">
              Ghi chú thêm (đối tượng dùng, chống chỉ định...)
            </label>
            <input
              type="text"
              placeholder="VD: Không dùng cho người dị ứng Paracetamol, dùng cho trẻ em > 6 tuổi..."
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
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>{medicineToEdit ? 'Lưu thay đổi' : 'Lưu vào Tủ thuốc (+10 XP)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
