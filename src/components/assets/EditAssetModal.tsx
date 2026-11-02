import React, { useState } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { RoomType, Asset } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface EditAssetModalProps {
  asset: Asset;
  onClose: () => void;
  onSuccess?: (updatedAsset: Asset) => void;
}

export const EditAssetModal: React.FC<EditAssetModalProps> = ({ asset, onClose, onSuccess }) => {
  const { updateAsset, settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const [name, setName] = useState(asset.name || '');
  const [category, setCategory] = useState(asset.category || 'Điện gia dụng');
  const [room, setRoom] = useState<RoomType>(asset.room || 'kitchen');
  const [priceStr, setPriceStr] = useState<string>(
    asset.price !== undefined && asset.price !== null && asset.price !== 0 ? String(asset.price) : ''
  );
  const [purchaseDate, setPurchaseDate] = useState(asset.purchaseDate || new Date().toISOString().split('T')[0]);
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState(
    asset.warrantyExpiryDate || new Date().toISOString().split('T')[0]
  );
  const [purchasePlace, setPurchasePlace] = useState(asset.purchasePlace || '');
  const [serialNumber, setSerialNumber] = useState(asset.serialNumber || '');
  const [status, setStatus] = useState<'good' | 'warning' | 'needs_service'>(asset.status || 'good');
  const [notes, setNotes] = useState(asset.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedData: Partial<Asset> = {
      name: name.trim(),
      category: category.trim() || 'Điện gia dụng',
      room,
      price: Number(priceStr) || 0,
      purchaseDate,
      warrantyExpiryDate,
      purchasePlace: purchasePlace.trim(),
      serialNumber: serialNumber.trim(),
      status,
      notes: notes.trim()
    };

    updateAsset(asset.id, updatedData);

    if (onSuccess) {
      onSuccess({
        ...asset,
        ...updatedData
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
            <span className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400">
              <Edit3 size={20} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('asset_edit_title')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                {t('asset_edit_desc')}
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
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {t('asset_category')}
            </label>
            <input
              type="text"
              list="edit-asset-categories-list"
              placeholder="VD: Điện gia dụng, Thiết bị bếp..."
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
            <datalist id="edit-asset-categories-list">
              <option value="Điện gia dụng" />
              <option value="Thiết bị bếp" />
              <option value="Điện tử & Giải trí" />
              <option value="Đồ nội thất" />
              <option value="Thiết bị làm sạch" />
              <option value="Thiết bị phòng tắm" />
              <option value="Khác" />
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('asset_room')}
              </label>
              <select
                value={room}
                onChange={e => setRoom(e.target.value as RoomType)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs outline-none"
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
                {t('asset_status')}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'good' | 'warning' | 'needs_service')}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs outline-none font-medium"
              >
                <option value="good">{t('asset_status_good')}</option>
                <option value="warning">{t('asset_status_warning')}</option>
                <option value="needs_service">{t('asset_status_needs_service')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs font-mono tabular-nums focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('asset_purchase_place')}
              </label>
              <input
                type="text"
                placeholder="VD: Điện Máy Xanh, Shopee..."
                value={purchasePlace}
                onChange={e => setPurchasePlace(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs outline-none focus:ring-1 focus:ring-primary-500"
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

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {t('asset_serial')}
            </label>
            <input
              type="text"
              placeholder="Serial / Model code"
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs font-mono"
            />
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
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition"
            >
              {t('action_cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 font-bold text-white rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Save size={15} />
              <span>{t('asset_save_changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
