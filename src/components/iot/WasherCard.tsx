import React from 'react';
import { Shirt, Power, CheckCircle2, RotateCw, Sparkles, Zap, Trash2, Clock } from 'lucide-react';
import { IoTDevice } from '../../types';

interface WasherCardProps {
  device: IoTDevice;
  onTogglePower: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateMetrics: (id: string, updates: Partial<IoTDevice>) => void;
  onCreateTask: (deviceId: string, title: string, xp: number) => void;
  isLinkedToAsset?: boolean;
}

export const WasherCard: React.FC<WasherCardProps> = ({
  device,
  onTogglePower,
  onDelete,
  onUpdateMetrics,
  onCreateTask,
  isLinkedToAsset
}) => {
  const w = device.washingMachine || {
    state: 'washing',
    remainingMinutes: 24,
    programName: 'Cotton Chăm sóc dịu nhẹ',
    doorLocked: true,
    drumCleanCycleCount: 14
  };

  const isCompleted = w.state === 'completed';
  const isRunning = w.state === 'washing' || w.state === 'rinsing' || w.state === 'spinning';

  const getStateLabel = () => {
    switch (w.state) {
      case 'washing': return 'Đang giặt chính';
      case 'rinsing': return 'Đang xả nước';
      case 'spinning': return 'Đang vắt cực khô';
      case 'completed': return 'Đã giặt xong';
      default: return 'Sẵn sàng';
    }
  };

  const getStateBadgeColor = () => {
    switch (w.state) {
      case 'completed': return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300';
      case 'spinning': return 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300';
      default: return 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300';
    }
  };

  const handleStartCycle = () => {
    onUpdateMetrics(device.id, {
      washingMachine: {
        ...w,
        state: 'washing',
        remainingMinutes: 30,
        doorLocked: true
      }
    });
  };

  const handleDoneTakingClothes = () => {
    onUpdateMetrics(device.id, {
      washingMachine: {
        ...w,
        state: 'idle',
        remainingMinutes: 0,
        doorLocked: false
      }
    });
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
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Shirt size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {device.name}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
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
          {/* Status & Progress Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-200/60 dark:border-purple-800/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStateBadgeColor()}`}>
                    {getStateLabel()}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    {w.programName}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mt-2">
                  {isRunning ? (
                    <>
                      <Clock size={16} className="text-purple-600 dark:text-purple-400 self-center animate-spin" />
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {w.remainingMinutes}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">phút còn lại</span>
                    </>
                  ) : isCompleted ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 size={18} />
                      <span>Chu trình giặt hoàn tất! Cần phơi đồ ngay.</span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-slate-500">
                      Đang ở trạng thái chờ lệnh giặt
                    </span>
                  )}
                </div>
              </div>

              {isRunning && (
                <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-600 animate-spin flex items-center justify-center shrink-0">
                  <RotateCw size={14} className="text-purple-600" />
                </div>
              )}
            </div>

            {/* Progress bar if running */}
            {isRunning && (
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(10, 100 - (w.remainingMinutes / 45) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          {isCompleted ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onCreateTask(device.id, `Lấy đồ trong ${device.name} đem phơi`, 10);
                  handleDoneTakingClothes();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Sparkles size={14} />
                <span>Nhận việc: Đem phơi quần áo (+10 XP)</span>
              </button>
            </div>
          ) : !isRunning ? (
            <button
              onClick={handleStartCycle}
              className="w-full py-2 px-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-purple-100 transition"
            >
              <RotateCw size={14} />
              <span>Chạy thử chu trình giặt Cotton (30 phút)</span>
            </button>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Khóa cửa an toàn: {w.doorLocked ? 'Đang khóa' : 'Mở'}</span>
              <span>Lồng giặt: {w.drumCleanCycleCount}/30 lần giặt</span>
            </div>
          )}

          {/* Bottom Bar: Power & Clean Status */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/80 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <Zap size={13} className="text-amber-400" />
              <span>{isRunning ? (device.currentWattage || 380) : 2}W (~{device.powerUsageKwhToday || device.powerUsageKwh} kWh/ngày)</span>
            </div>

            <button
              onClick={() => onCreateTask(device.id, `Vệ sinh lồng giặt cho ${device.name}`, 25)}
              className="text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              Nhắc vệ sinh lồng giặt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
