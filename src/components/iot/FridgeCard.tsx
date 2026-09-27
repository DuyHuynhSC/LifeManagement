import React from 'react';
import { Thermometer, Power, ShieldAlert, Zap, Snowflake, Leaf, Trash2 } from 'lucide-react';
import { IoTDevice } from '../../types';

interface FridgeCardProps {
  device: IoTDevice;
  onTogglePower: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateMetrics: (id: string, updates: Partial<IoTDevice>) => void;
  onCreateTask: (deviceId: string, title: string, xp: number) => void;
  isLinkedToAsset?: boolean;
}

export const FridgeCard: React.FC<FridgeCardProps> = ({
  device,
  onTogglePower,
  onDelete,
  onUpdateMetrics,
  onCreateTask,
  isLinkedToAsset
}) => {
  const f = device.fridge || {
    fridgeTemp: 3,
    freezerTemp: -18,
    doorAjar: false,
    fastFreezing: false,
    ecoMode: true
  };

  const toggleEco = () => {
    if (!device.fridge) return;
    onUpdateMetrics(device.id, {
      fridge: {
        ...device.fridge,
        ecoMode: !device.fridge.ecoMode
      }
    });
  };

  const toggleFastFreeze = () => {
    if (!device.fridge) return;
    onUpdateMetrics(device.id, {
      fridge: {
        ...device.fridge,
        fastFreezing: !device.fridge.fastFreezing
      }
    });
  };

  const toggleDoorAlertSimulation = () => {
    if (!device.fridge) return;
    const nextDoorState = !device.fridge.doorAjar;
    onUpdateMetrics(device.id, {
      fridge: {
        ...device.fridge,
        doorAjar: nextDoorState
      }
    });
    if (nextDoorState) {
      onCreateTask(device.id, `Cảnh báo: Kiểm tra đóng kín cửa ${device.name}`, 15);
    }
  };

  return (
    <div
      className={`rounded-3xl border transition-all p-4 relative overflow-hidden ${
        device.isOnline
          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Snowflake size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {device.name}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                {device.provider.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span>{device.location}</span>
              <span>•</span>
              <span>{device.lastUpdated}</span>
              {isLinkedToAsset && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  • Đã liên kết Đồ dùng
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onTogglePower(device.id)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
              device.isOnline
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-rose-100 hover:text-rose-600'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'
            }`}
            title={device.isOnline ? 'Nhấn để tắt kết nối' : 'Nhấn để bật kết nối'}
          >
            <Power size={14} />
          </button>
          <button
            onClick={() => onDelete(device.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            title="Xóa thiết bị"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {device.isOnline && (
        <div className="mt-4 space-y-3.5">
          {/* Cảnh báo cửa mở quên nếu có */}
          {f.doorAjar && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-600 animate-bounce" />
                <span className="font-semibold">Cửa tủ lạnh đang mở quên &gt; 3 phút!</span>
              </div>
              <button
                onClick={toggleDoorAlertSimulation}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
              >
                Đã đóng cửa
              </button>
            </div>
          )}

          {/* Dual Temp Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Ngăn mát */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Ngăn Mát (Cool)
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800 dark:text-white">
                  {f.fridgeTemp > 0 ? `+${f.fridgeTemp}` : f.fridgeTemp}
                </span>
                <span className="text-xs font-semibold text-slate-400">°C</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                Chuẩn bảo quản 2°C - 5°C
              </div>
            </div>

            {/* Ngăn đông */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Ngăn Đông (Freeze)
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {f.freezerTemp}
                </span>
                <span className="text-xs font-semibold text-slate-400">°C</span>
              </div>
              <div className="text-[10px] text-indigo-500 font-medium mt-1">
                Làm đá ổn định
              </div>
            </div>
          </div>

          {/* Quick Controls: Eco Mode & Fast Freezing */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleEco}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                f.ecoMode
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Leaf size={14} className={f.ecoMode ? 'text-emerald-500' : 'text-slate-400'} />
              <span>Chế độ Eco {f.ecoMode ? '(Bật)' : '(Tắt)'}</span>
            </button>

            <button
              onClick={toggleFastFreeze}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                f.fastFreezing
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Snowflake size={14} className={f.fastFreezing ? 'text-blue-500' : 'text-slate-400'} />
              <span>Làm đá nhanh</span>
            </button>
          </div>

          {/* Bottom Bar: Power & Status */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/80 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <Zap size={13} className="text-amber-400" />
              <span>{device.currentWattage || 95}W (~{device.powerUsageKwhToday || device.powerUsageKwh} kWh/ngày)</span>
            </div>

            <button
              onClick={toggleDoorAlertSimulation}
              className="text-[11px] font-medium text-slate-500 hover:text-rose-500 transition"
            >
              Mô phỏng thử quên đóng cửa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
