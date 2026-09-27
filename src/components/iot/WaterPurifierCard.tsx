import React from 'react';
import { Droplet, Power, ShieldCheck, AlertCircle, Wrench, Zap, Trash2 } from 'lucide-react';
import { IoTDevice } from '../../types';

interface WaterPurifierCardProps {
  device: IoTDevice;
  onTogglePower: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateTask: (deviceId: string, title: string, xp: number) => void;
  isLinkedToAsset?: boolean;
}

export const WaterPurifierCard: React.FC<WaterPurifierCardProps> = ({
  device,
  onTogglePower,
  onDelete,
  onCreateTask,
  isLinkedToAsset
}) => {
  const wp = device.waterPurifier || {
    tdsInPpm: 185,
    tdsOutPpm: 14,
    filter1LifePercent: 82,
    filterRoLifePercent: 94,
    filterMineralPercent: 90,
    isLeaking: false,
    litersToday: 9.2
  };

  const isTdsSafe = wp.tdsOutPpm < 30;

  return (
    <div
      className={`rounded-3xl border transition-all p-4 relative overflow-hidden ${
        device.isOnline
          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Droplet size={24} className="fill-cyan-500/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {device.name}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300">
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
          {/* TDS Monitor Highlight Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-200/60 dark:border-cyan-800/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Chỉ số TDS Nước Uống
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className={`text-2xl font-black ${isTdsSafe ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600'}`}>
                    {wp.tdsOutPpm}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">ppm</span>
                  <div className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck size={11} />
                    <span>Nước chuẩn tinh khiết</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Nước cấp vào</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {wp.tdsInPpm} ppm
                </span>
              </div>
            </div>
          </div>

          {/* Filter Lifespan Bars */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
              <span>Tuổi thọ Lõi Lọc</span>
              <span className="text-[10px] text-slate-400">Đã lọc: {wp.litersToday} L hôm nay</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Lõi 1 */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Lõi thô số 1</span>
                  <span className={`font-bold ${wp.filter1LifePercent < 20 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400'}`}>
                    {wp.filter1LifePercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      wp.filter1LifePercent < 20 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, wp.filter1LifePercent))}%` }}
                  />
                </div>
              </div>

              {/* Lõi RO */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Màng RO Filmtec</span>
                  <span className={`font-bold ${wp.filterRoLifePercent < 15 ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}`}>
                    {wp.filterRoLifePercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      wp.filterRoLifePercent < 15 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, wp.filterRoLifePercent))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Power & Action */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/80 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <Zap size={13} className="text-amber-400" />
              <span>{device.currentWattage || 35}W (~{device.powerUsageKwhToday || device.powerUsageKwh} kWh/ngày)</span>
            </div>

            <button
              onClick={() => onCreateTask(device.id, `Kiểm tra & Vệ sinh lõi lọc nước ${device.name}`, 20)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700"
            >
              <Wrench size={12} />
              <span>Tạo việc bảo dưỡng (+20 XP)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
