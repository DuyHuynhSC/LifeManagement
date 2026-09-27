import React from 'react';
import { Cpu, Power, Trash2, Zap } from 'lucide-react';
import { IoTDevice } from '../../types';

interface GenericDeviceCardProps {
  device: IoTDevice;
  onTogglePower: (id: string) => void;
  onDelete: (id: string) => void;
  isLinkedToAsset?: boolean;
}

export const GenericDeviceCard: React.FC<GenericDeviceCardProps> = ({
  device,
  onTogglePower,
  onDelete,
  isLinkedToAsset
}) => {
  return (
    <div
      className={`rounded-3xl border transition-all p-4 relative overflow-hidden ${
        device.isOnline
          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Cpu size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {device.name}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
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
            title={device.isOnline ? 'Tắt kết nối' : 'Bật kết nối'}
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

      {device.isOnline && device.metrics && device.metrics.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
          <div className="grid grid-cols-2 gap-2">
            {device.metrics.map((m, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60"
              >
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {m.label}
                </div>
                <div className="text-xs font-bold mt-0.5 text-slate-800 dark:text-slate-200">
                  {m.value} {m.unit || ''}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 mt-2 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <Zap size={13} className="text-amber-400" />
            <span>Tiêu thụ: {device.powerUsageKwhToday || device.powerUsageKwh} kWh</span>
          </div>
        </div>
      )}
    </div>
  );
};
