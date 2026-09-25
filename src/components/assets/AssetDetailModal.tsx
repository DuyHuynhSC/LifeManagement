import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  Calendar, 
  MapPin, 
  Tag, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { Asset, AssetComponent } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface AssetDetailModalProps {
  asset: Asset;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, onClose }) => {
  const { 
    addComponentToAsset, 
    replaceComponent, 
    deleteAsset, 
    currentUser, 
    settings 
  } = useAppStore();

  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompLifespan, setNewCompLifespan] = useState(90);
  const [newCompCostStr, setNewCompCostStr] = useState('100000');
  const [newCompNotes, setNewCompNotes] = useState('');
  const [celebrationMsg, setCelebrationMsg] = useState('');

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'manager';
  const canDelete = currentUser.role === 'admin';

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    addComponentToAsset(asset.id, {
      name: newCompName.trim(),
      installDate: new Date().toISOString().split('T')[0],
      lifespanDays: Number(newCompLifespan),
      currentWearPercent: 100,
      replacementCost: Number(newCompCostStr) || 0,
      notes: newCompNotes.trim()
    });

    setNewCompName('');
    setNewCompNotes('');
    setShowAddComponent(false);
  };

  const handleReplace = (comp: AssetComponent) => {
    if (window.confirm(`Xác nhận đã thay mới "${comp.name}"? Chi phí ${comp.replacementCost.toLocaleString('vi-VN')} đ sẽ được tự động ghi nhận vào sổ chi tiêu và bạn nhận +40 XP!`)) {
      replaceComponent(asset.id, comp.id);
      setCelebrationMsg(`Đã thay mới "${comp.name}" thành công! (+40 XP)`);
      setTimeout(() => setCelebrationMsg(''), 4000);
    }
  };

  const handleDeleteAsset = () => {
    if (window.confirm(`Bạn có chắc muốn xóa thiết bị "${asset.name}"? Thao tác này không thể hoàn tác.`)) {
      deleteAsset(asset.id);
      onClose();
    }
  };

  const today = new Date();
  const warrantyDate = new Date(asset.warrantyExpiryDate);
  const warrantyDaysLeft = Math.ceil((warrantyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isWarrantyExpired = warrantyDaysLeft < 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Wrench size={20} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {asset.name}
              </h2>
              <div className="text-[11px] text-slate-500 capitalize">
                {asset.category} • {asset.room}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Celebration Banner */}
        {celebrationMsg && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 flex items-center gap-2 animate-bounce">
            <Sparkles size={16} />
            <span>{celebrationMsg}</span>
          </div>
        )}

        {/* Content Scroll */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Main Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Giá mua</div>
              <div className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">
                {asset.price.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Hạn bảo hành</div>
              <div className={`font-bold mt-0.5 flex items-center gap-1 ${
                isWarrantyExpired 
                  ? 'text-rose-600' 
                  : warrantyDaysLeft <= settings.notifyDaysBeforeExpiry 
                  ? 'text-amber-600' 
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {isWarrantyExpired ? (
                  <span>Hết hạn</span>
                ) : (
                  <span>Còn {warrantyDaysLeft} ngày</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Nơi mua</div>
              <div className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5 truncate">
                {asset.purchasePlace || 'Chưa cập nhật'}
              </div>
            </div>

            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Serial / Model</div>
              <div className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5 truncate">
                {asset.serialNumber || 'N/A'}
              </div>
            </div>
          </div>

          {asset.notes && (
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
              <strong>Ghi chú:</strong> {asset.notes}
            </div>
          )}

          {/* Sub-Components Section (TÍNH NĂNG ĐỘC ĐÁO CỦA PROJECT.MD) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t('asset_components_list')} ({asset.components.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Theo dõi % hao mòn và hạn thay từng linh kiện riêng biệt
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowAddComponent(!showAddComponent)}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus size={14} />
                  {t('asset_add_component')}
                </button>
              )}
            </div>

            {/* Add Component Form */}
            {showAddComponent && (
              <form onSubmit={handleAddComponent} className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-2 text-xs">
                <div className="font-bold text-indigo-900 dark:text-indigo-200">
                  Thêm linh kiện mới
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Tên linh kiện *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Lõi số 1 PP, Màng HEPA..."
                    value={newCompName}
                    onChange={e => setNewCompName(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Chu kỳ (ngày)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newCompLifespan}
                      onChange={e => setNewCompLifespan(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Chi phí thay (đ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0"
                      value={newCompCostStr ? Number(newCompCostStr).toLocaleString('vi-VN') : ''}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const cleaned = digits.replace(/^0+(?=\d)/, '');
                        setNewCompCostStr(cleaned);
                      }}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700"
                  >
                    Lưu linh kiện
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddComponent(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* Component Cards */}
            <div className="space-y-2">
              {asset.components.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  Chưa có linh kiện phụ thuộc nào được thêm.
                </div>
              ) : (
                asset.components.map(comp => {
                  const isLow = comp.currentWearPercent <= 20;
                  const isMedium = comp.currentWearPercent <= 50;

                  return (
                    <div
                      key={comp.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isLow
                          ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/60'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {comp.name}
                            {isLow && (
                              <span className="text-[10px] font-extrabold bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 px-1.5 py-0.2 rounded-full">
                                Cần thay ngay!
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Chu kỳ: {comp.lifespanDays} ngày • Chi phí thay: <strong>{comp.replacementCost.toLocaleString('vi-VN')} đ</strong>
                          </div>
                        </div>

                        {canEdit && (
                          <button
                            onClick={() => handleReplace(comp)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition"
                            title="Xác nhận đã thay mới linh kiện này"
                          >
                            <CheckCircle2 size={13} />
                            {t('action_replace_component')}
                          </button>
                        )}
                      </div>

                      {/* Wear Bar */}
                      <div className="mt-2.5 space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>Tuổi thọ còn lại</span>
                          <span className={isLow ? 'text-rose-600 font-bold' : isMedium ? 'text-amber-600' : 'text-emerald-600'}>
                            {comp.currentWearPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLow ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${comp.currentWearPercent}%` }}
                          />
                        </div>
                      </div>

                      {comp.notes && (
                        <div className="text-[10px] text-slate-400 mt-1 italic">
                          {comp.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
          {canDelete ? (
            <button
              onClick={handleDeleteAsset}
              className="flex items-center gap-1.5 text-xs text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50 px-3 py-2 rounded-xl transition"
            >
              <Trash2 size={15} />
              {t('action_delete')}
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-300 transition"
          >
            {t('action_close')}
          </button>
        </div>
      </div>
    </div>
  );
};
