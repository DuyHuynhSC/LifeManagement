import React, { useState, useMemo } from 'react';
import { 
  X, 
  Pill, 
  Plus, 
  Search, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Clock, 
  Trash2, 
  Pencil, 
  CheckCircle2, 
  Minus, 
  ShieldAlert, 
  Info,
  Sparkles
} from 'lucide-react';
import { MedicineItem, MedicineCategory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { AddMedicineModal, MEDICINE_CATEGORY_LABELS } from './AddMedicineModal';

interface MedicineCabinetModalProps {
  onClose: () => void;
}

export const MedicineCabinetModal: React.FC<MedicineCabinetModalProps> = ({ onClose }) => {
  const { medicineItems, deleteMedicineItem, useMedicine, updateMedicineItem, settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MedicineCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineItem | null>(null);
  const [useNotice, setUseNotice] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Phân tích trạng thái của thuốc:
  // - expired: expiryDate < today
  // - expiring_soon: expiryDate <= today + 30 days
  // - low_stock: quantity <= (minQuantityAlert || 2)
  const medicinesWithStatus = useMemo(() => {
    return medicineItems.map(med => {
      const exp = new Date(med.expiryDate);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const isExpired = diffDays < 0;
      const isExpiringSoon = diffDays >= 0 && diffDays <= 30;
      const isLowStock = med.quantity <= (med.minQuantityAlert !== undefined ? med.minQuantityAlert : 2);

      return {
        ...med,
        diffDays,
        isExpired,
        isExpiringSoon,
        isLowStock
      };
    });
  }, [medicineItems]);

  // Thống kê cảnh báo
  const expiredCount = medicinesWithStatus.filter(m => m.isExpired).length;
  const expiringSoonCount = medicinesWithStatus.filter(m => m.isExpiringSoon).length;
  const lowStockCount = medicinesWithStatus.filter(m => m.isLowStock && m.quantity > 0).length;
  const outOfStockCount = medicinesWithStatus.filter(m => m.quantity === 0).length;

  const filteredMedicines = medicinesWithStatus.filter(med => {
    const matchesCategory = selectedCategory === 'all' || med.category === selectedCategory;
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.dosageInstructions && med.dosageInstructions.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (med.storageLocation && med.storageLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (med.notes && med.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    // Ưu tiên thuốc hết hạn lên trước, sau đó thuốc sắp hết hạn, rồi theo ngày hạn tăng dần
    if (a.isExpired && !b.isExpired) return -1;
    if (!a.isExpired && b.isExpired) return 1;
    if (a.isExpiringSoon && !b.isExpiringSoon) return -1;
    if (!a.isExpiringSoon && b.isExpiringSoon) return 1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  const handleUse = (med: MedicineItem) => {
    if (med.quantity <= 0) return;
    const nextQty = useMedicine(med.id, 1);
    setUseNotice(`Đã ghi nhận sử dụng 1 ${med.unit} "${med.name}" (còn ${nextQty} ${med.unit})`);
    setTimeout(() => setUseNotice(null), 3000);
  };

  const handleAddStock = (med: MedicineItem) => {
    updateMedicineItem(med.id, { quantity: med.quantity + 1 });
    setUseNotice(`Đã thêm 1 ${med.unit} "${med.name}" (tổng: ${med.quantity + 1} ${med.unit})`);
    setTimeout(() => setUseNotice(null), 3000);
  };

  const handleDelete = (med: MedicineItem) => {
    if (window.confirm(`Xóa thuốc "${med.name}" khỏi tủ thuốc gia đình?`)) {
      deleteMedicineItem(med.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shadow-xs">
              💊
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Tủ thuốc Gia đình
                </h2>
                <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-mono">
                  {medicineItems.length} loại
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Quản lý hạn sử dụng, liều dùng & cơ số dự phòng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition"
            >
              <Plus size={15} />
              <span className="hidden xs:inline">Thêm thuốc</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Thông báo thao tác */}
        {useNotice && (
          <div className="mt-3 p-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn shrink-0">
            <CheckCircle2 size={16} />
            <span>{useNotice}</span>
          </div>
        )}

        {/* Banner cảnh báo an toàn thuốc */}
        {(expiredCount > 0 || expiringSoonCount > 0 || lowStockCount > 0 || outOfStockCount > 0) && (
          <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 shrink-0 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <ShieldAlert size={15} className="text-rose-500 shrink-0" />
              <span>Cảnh báo An toàn Tủ thuốc:</span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
              {expiredCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/60 animate-pulse">
                  ⚠️ {expiredCount} thuốc đã hết hạn (Vứt bỏ ngay)
                </span>
              )}
              {expiringSoonCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60">
                  ⏳ {expiringSoonCount} thuốc hết hạn trong 30 ngày
                </span>
              )}
              {outOfStockCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  ❌ {outOfStockCount} thuốc đã hết
                </span>
              )}
              {lowStockCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300/60">
                  📦 {lowStockCount} thuốc sắp hết
                </span>
              )}
            </div>
          </div>
        )}

        {/* Thanh tìm kiếm & Bộ lọc nhóm thuốc */}
        <div className="mt-3 space-y-2 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên thuốc, công dụng, vị trí cất..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-bold transition flex items-center gap-1 border ${
                selectedCategory === 'all'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>Tất cả</span>
              <span className="font-mono text-[10px]">({medicineItems.length})</span>
            </button>

            {Object.entries(MEDICINE_CATEGORY_LABELS).map(([catKey, val]) => {
              const count = medicineItems.filter(m => m.category === catKey).length;
              if (count === 0 && selectedCategory !== catKey) return null;
              const isSelected = selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey as MedicineCategory)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-bold transition flex items-center gap-1 border ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{val.icon}</span>
                  <span>{val.label}</span>
                  <span className="font-mono text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Danh sách thẻ thuốc (Scrollable) */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-0.5">
          {filteredMedicines.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
              <Pill size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Không tìm thấy thuốc nào phù hợp.
              </p>
              <p className="text-[11px] text-slate-400">
                Bấm "+ Thêm thuốc" để ghi danh mục thuốc trong nhà.
              </p>
            </div>
          ) : (
            filteredMedicines.map(med => {
              const catInfo = MEDICINE_CATEGORY_LABELS[med.category] || MEDICINE_CATEGORY_LABELS.other;

              return (
                <div
                  key={med.id}
                  className={`p-3.5 rounded-2xl border transition-all shadow-xs space-y-2 ${
                    med.isExpired
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/80'
                      : med.isExpiringSoon
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/80'
                      : 'bg-slate-50/60 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-300'
                  }`}
                >
                  {/* Top line: Icon, Name & Quantity Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 text-lg flex items-center justify-center shrink-0 shadow-2xs border border-slate-200 dark:border-slate-600">
                        {catInfo.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {med.name}
                          </h3>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded-md"
                            style={{
                              backgroundColor: `${catInfo.color}15`,
                              color: catInfo.color
                            }}
                          >
                            {catInfo.label}
                          </span>
                        </div>

                        {med.storageLocation && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-slate-400" />
                            <span>{med.storageLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Số lượng & Nút trừ/cộng nhanh */}
                    <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-700/90 rounded-xl p-1 border border-slate-200 dark:border-slate-600 shadow-2xs">
                      <button
                        onClick={() => handleUse(med)}
                        disabled={med.quantity <= 0}
                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 disabled:opacity-30 flex items-center justify-center text-slate-700 dark:text-slate-200 transition"
                        title="Dùng 1 đơn vị"
                      >
                        <Minus size={12} />
                      </button>

                      <div className="px-1.5 text-center">
                        <span className={`font-mono tabular-nums font-black text-xs ${
                          med.quantity === 0
                            ? 'text-rose-600'
                            : med.isLowStock
                            ? 'text-amber-600'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {med.quantity}
                        </span>
                        <span className="text-[9px] text-slate-400 block -mt-0.5">{med.unit}</span>
                      </div>

                      <button
                        onClick={() => handleAddStock(med)}
                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-950 flex items-center justify-center text-slate-700 dark:text-slate-200 transition"
                        title="Thêm 1 đơn vị"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Liều dùng & chỉ định */}
                  {med.dosageInstructions && (
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">Liều dùng: </span>
                      {med.dosageInstructions}
                    </div>
                  )}

                  {med.notes && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                      Lưu ý: {med.notes}
                    </p>
                  )}

                  {/* Footer: Hạn sử dụng & Nút Sửa/Xóa */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Calendar size={11} className="text-slate-400" />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">HSD: {med.expiryDate}</span>

                      {med.isExpired ? (
                        <span className="font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.2 rounded">
                          ĐÃ HẾT HẠN!
                        </span>
                      ) : med.isExpiringSoon ? (
                        <span className="font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded animate-pulse">
                          Còn {med.diffDays} ngày
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          (còn {med.diffDays} ngày)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingMedicine(med)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
                        title="Chỉnh sửa thuốc"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(med)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 dark:hover:bg-rose-950 transition"
                        title="Xóa thuốc"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Thêm / Sửa Thuốc */}
        {showAddModal && (
          <AddMedicineModal
            onClose={() => setShowAddModal(false)}
          />
        )}

        {editingMedicine && (
          <AddMedicineModal
            medicineToEdit={editingMedicine}
            onClose={() => setEditingMedicine(null)}
          />
        )}
      </div>
    </div>
  );
};
