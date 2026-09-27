import React, { useState } from 'react';
import { X, Plus, Cpu, Droplet, Snowflake, Shirt, Wind } from 'lucide-react';
import { IoTDevice, IoTProviderType } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (device: Omit<IoTDevice, 'id'>) => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const { assets } = useAppStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<IoTDevice['type']>('water_purifier');
  const [provider, setProvider] = useState<IoTProviderType>('tuya');
  const [location, setLocation] = useState('Bếp tầng 1');
  const [linkedAssetId, setLinkedAssetId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let waterPurifier;
    let fridge;
    let washingMachine;
    let metrics: IoTDevice['metrics'] = [];
    let powerUsageKwh = 0.5;
    let currentWattage = 50;

    if (type === 'water_purifier') {
      waterPurifier = {
        tdsInPpm: 190,
        tdsOutPpm: 15,
        filter1LifePercent: 85,
        filterRoLifePercent: 95,
        filterMineralPercent: 90,
        isLeaking: false,
        litersToday: 5.0
      };
      metrics = [
        { label: 'TDS đầu ra (uống)', value: 15, unit: 'ppm', status: 'normal' },
        { label: 'TDS nước cấp vào', value: 190, unit: 'ppm', status: 'normal' },
        { label: 'Tuổi thọ Lõi 1', value: 85, unit: '%', status: 'normal' },
        { label: 'Tuổi thọ Lõi RO', value: 95, unit: '%', status: 'normal' }
      ];
      powerUsageKwh = 0.25;
      currentWattage = 35;
    } else if (type === 'fridge') {
      fridge = {
        fridgeTemp: 3,
        freezerTemp: -18,
        doorAjar: false,
        fastFreezing: false,
        ecoMode: true
      };
      metrics = [
        { label: 'Nhiệt độ ngăn mát', value: 3, unit: '°C', status: 'normal' },
        { label: 'Nhiệt độ ngăn đông', value: -18, unit: '°C', status: 'normal' },
        { label: 'Cửa tủ lạnh', value: 'Đóng kín', status: 'normal' },
        { label: 'Chế độ', value: 'Eco Tiết kiệm', status: 'normal' }
      ];
      powerUsageKwh = 1.35;
      currentWattage = 90;
    } else if (type === 'washing_machine') {
      washingMachine = {
        state: 'idle' as const,
        remainingMinutes: 0,
        programName: 'Giặt nhanh 30p',
        doorLocked: false,
        drumCleanCycleCount: 5
      };
      metrics = [
        { label: 'Trạng thái', value: 'Chờ lệnh giặt', status: 'normal' },
        { label: 'Thời gian còn lại', value: 0, unit: 'phút', status: 'normal' },
        { label: 'Cửa máy giặt', value: 'Mở khóa', status: 'normal' },
        { label: 'Vệ sinh lồng giặt', value: '5/30 lần', status: 'normal' }
      ];
      powerUsageKwh = 0.6;
      currentWattage = 350;
    }

    onAdd({
      name: name.trim(),
      type,
      location: location.trim(),
      provider,
      linkedAssetId: linkedAssetId || undefined,
      isOnline: true,
      powerUsageKwh,
      powerUsageKwhToday: powerUsageKwh,
      powerUsageKwhMonth: +(powerUsageKwh * 30).toFixed(1),
      currentWattage,
      metrics,
      waterPurifier,
      fridge,
      washingMachine,
      alerts: [],
      lastUpdated: 'Vừa xong'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Plus size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Thêm thiết bị IoT mới
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tên thiết bị */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Tên thiết bị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="VD: Máy lọc nước Karofi, Tủ lạnh Samsung..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Loại thiết bị */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Loại thiết bị
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setType('water_purifier'); setProvider('tuya'); }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  type === 'water_purifier'
                    ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Droplet size={18} />
                <span className="text-[11px]">Máy lọc nước</span>
              </button>

              <button
                type="button"
                onClick={() => { setType('fridge'); setProvider('smartthings'); }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  type === 'fridge'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Snowflake size={18} />
                <span className="text-[11px]">Tủ lạnh</span>
              </button>

              <button
                type="button"
                onClick={() => { setType('washing_machine'); setProvider('lg_thinq'); }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  type === 'washing_machine'
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Shirt size={18} />
                <span className="text-[11px]">Máy giặt</span>
              </button>
            </div>
          </div>

          {/* Nhà cung cấp Cloud / Hub */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nguồn kết nối Cloud / Giao thức
            </label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as IoTProviderType)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="smartthings">Samsung SmartThings Cloud API</option>
              <option value="tuya">Tuya / SmartLife OpenAPI (Karofi/Kangaroo)</option>
              <option value="lg_thinq">LG ThinQ Connect API</option>
              <option value="tsmartlife">Toshiba TSmartLife Cloud (Tủ lạnh, Máy giặt Toshiba)</option>
              <option value="simulation">Mô phỏng Telemetry thông minh (Simulation)</option>
            </select>
          </div>

          {/* Vị trí */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Vị trí trong nhà
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="VD: Bếp tầng 1, Ban công tầng 2..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Liên kết với Đồ dùng (Asset) đã có */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Liên kết với Đồ dùng (Asset) trong nhà (Tùy chọn)
            </label>
            <select
              value={linkedAssetId}
              onChange={e => setLinkedAssetId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- Không liên kết --</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.category})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Khi liên kết, dữ liệu hao mòn lõi/linh kiện sẽ tự động đồng bộ vào hồ sơ Đồ dùng.
            </p>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-md transition"
            >
              Thêm thiết bị
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
