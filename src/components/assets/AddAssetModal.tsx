import React, { useState } from 'react';
import { X, Tv2, QrCode, Plus, Trash2 } from 'lucide-react';
import { RoomType, AssetComponent } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface AddAssetModalProps {
  onClose: () => void;
  onOpenQRScanner?: () => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ onClose, onOpenQRScanner }) => {
  const { addAsset, settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Điện gia dụng');
  const [room, setRoom] = useState<RoomType>('kitchen');
  const [priceStr, setPriceStr] = useState<string>('5000000');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Default warranty 2 years from today
  const defaultWarranty = new Date();
  defaultWarranty.setFullYear(defaultWarranty.getFullYear() + 2);
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState(defaultWarranty.toISOString().split('T')[0]);

  const [purchasePlace, setPurchasePlace] = useState('Điện Máy Xanh');
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Initial components
  const [components, setComponents] = useState<Omit<AssetComponent, 'id' | 'assetId'>[]>([]);

  const handleAddComponent = () => {
    setComponents([
      ...components,
      {
        name: '',
        installDate: new Date().toISOString().split('T')[0],
        lifespanDays: 90,
        currentWearPercent: 100,
        replacementCost: 80000
      }
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addAsset({
      name: name.trim(),
      category,
      room,
      price: Number(priceStr) || 0,
      purchaseDate,
      warrantyExpiryDate,
      purchasePlace: purchasePlace.trim(),
      serialNumber: serialNumber.trim(),
      notes: notes.trim(),
      status: 'good',
      components: components
        .filter(c => c.name.trim() !== '')
        .map((c, idx) => ({
          ...c,
          name: c.name.trim(),
          id: `comp-${Date.now()}-${idx}`,
          assetId: ''
        }))
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Tv2 size={20} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('asset_add_new')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                Thêm thiết bị và các linh kiện cần theo dõi bảo dưỡng
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
          {/* QR Scan Helper */}
          {onOpenQRScanner && (
            <button
              type="button"
              onClick={onOpenQRScanner}
              className="w-full p-2.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold transition hover:bg-indigo-100"
            >
              <QrCode size={16} />
              <span>Quét mã QR / Hóa đơn để tự động điền</span>
            </button>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {t('asset_name')} *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Máy hút ẩm Sharp, Tủ lạnh Panasonic..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('asset_room')}
              </label>
              <select
                value={room}
                onChange={e => setRoom(e.target.value as RoomType)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
              >
                <option value="living_room">{t('room_living_room')}</option>
                <option value="kitchen">{t('room_kitchen')}</option>
                <option value="bedroom">{t('room_bedroom')}</option>
                <option value="bathroom">{t('room_bathroom')}</option>
                <option value="balcony">{t('room_balcony')}</option>
                <option value="other">{t('room_other')}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('asset_price')} (đ)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={priceStr ? Number(priceStr).toLocaleString('vi-VN') : ''}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const cleaned = digits.replace(/^0+(?=\d)/, '');
                  setPriceStr(cleaned);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('asset_purchase_date')}
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('asset_warranty_expiry')}
              </label>
              <input
                type="date"
                value={warrantyExpiryDate}
                onChange={e => setWarrantyExpiryDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('asset_purchase_place')}
              </label>
              <input
                type="text"
                placeholder="Điện Máy Xanh, Shopee..."
                value={purchasePlace}
                onChange={e => setPurchasePlace(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('asset_serial')}
              </label>
              <input
                type="text"
                placeholder="Serial / Model code"
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* Sub-Components Initial Setup */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {t('asset_components_list')} ({components.length})
              </span>
              <button
                type="button"
                onClick={handleAddComponent}
                className="flex items-center gap-1 text-[11px] text-indigo-600 font-bold hover:underline"
              >
                <Plus size={14} /> Thêm linh kiện
              </button>
            </div>

            {components.map((comp, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tên linh kiện"
                  value={comp.name}
                  onChange={e => {
                    const newArr = [...components];
                    newArr[idx].name = e.target.value;
                    setComponents(newArr);
                  }}
                  className="flex-1 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-[11px]"
                />
                <input
                  type="number"
                  placeholder="Ngày"
                  title="Chu kỳ sử dụng (ngày)"
                  value={comp.lifespanDays}
                  onChange={e => {
                    const newArr = [...components];
                    newArr[idx].lifespanDays = Number(e.target.value);
                    setComponents(newArr);
                  }}
                  className="w-16 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveComponent(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Ghi chú thêm
            </label>
            <textarea
              rows={2}
              placeholder="Vị trí lắp đặt, hướng dẫn lưu ý..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
            />
          </div>

          {/* Footer Submit */}
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
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-white rounded-xl shadow-md transition"
            >
              {t('action_add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
