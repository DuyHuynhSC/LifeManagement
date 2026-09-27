import React, { useState } from 'react';
import { Shirt, Power, CheckCircle2, RotateCw, Sparkles, Zap, Trash2, Clock, Cloud, RefreshCw, AlertCircle } from 'lucide-react';
import { IoTDevice } from '../../types';
import { useAppStore } from '../../store/useAppStore';

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
  const { settings, syncLGWasherLiveState } = useAppStore();
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  const w = device.washingMachine || {
    state: 'idle',
    remainingMinutes: 0,
    programName: 'Chờ lệnh giặt',
    doorLocked: false,
    drumCleanCycleCount: 14,
    dataSource: 'live_api'
  };

  const isLiveMode = w.dataSource !== 'simulator' && Boolean(settings.lgThinqToken);
  const isCompleted = w.state === 'completed';
  const isRunning = w.state === 'washing' || w.state === 'rinsing' || w.state === 'spinning';

  const getStateLabel = () => {
    switch (w.state) {
      case 'washing': return 'Đang giặt chính';
      case 'rinsing': return 'Đang xả nước';
      case 'spinning': return 'Đang vắt cực khô';
      case 'completed': return 'Đã giặt xong';
      default: return w.isPoweredOn ? 'Bật nguồn - Chờ bấm giặt' : 'Sẵn sàng / Tắt nguồn';
    }
  };

  const getStateBadgeColor = () => {
    switch (w.state) {
      case 'completed': return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300';
      case 'spinning': return 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300';
      case 'washing':
      case 'rinsing': return 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
    }
  };

  // Đồng bộ thời gian thực từ LG ThinQ Cloud
  const handleSyncFromLG = async () => {
    setIsSyncingLive(true);
    setLiveNotice(null);

    const res = await syncLGWasherLiveState(device.id);
    setIsSyncingLive(false);

    if (res.success) {
      setLiveNotice(res.message);
    } else {
      setLiveNotice(res.message || 'Chưa nhận được phản hồi từ máy giặt LG.');
    }

    setTimeout(() => {
      setLiveNotice(null);
    }, 6000);
  };

  // Chuyển sang chế độ mô phỏng hoặc live
  const toggleDataSourceMode = (mode: 'live_api' | 'simulator') => {
    if (mode === 'simulator') {
      onUpdateMetrics(device.id, {
        washingMachine: {
          ...w,
          dataSource: 'simulator',
          state: 'washing',
          remainingMinutes: 30,
          doorLocked: true,
          programName: 'Cotton Tiêu chuẩn (Mô phỏng)'
        }
      });
      setLiveNotice('Đã chuyển sang chế độ Mô phỏng (Simulator) với chu trình 30 phút chạy thử.');
    } else {
      onUpdateMetrics(device.id, {
        washingMachine: {
          ...w,
          dataSource: 'live_api'
        }
      });
      handleSyncFromLG();
    }

    setTimeout(() => {
      setLiveNotice(null);
    }, 4000);
  };

  const handleStartSimulatedCycle = () => {
    onUpdateMetrics(device.id, {
      washingMachine: {
        ...w,
        dataSource: 'simulator',
        state: 'washing',
        remainingMinutes: 30,
        doorLocked: true,
        programName: 'Cotton Chăm sóc dịu nhẹ (Mô phỏng)'
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
          {/* Mode Badge & Switcher */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-1.5">
              {isLiveMode ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Cloud size={13} />
                  <span>LG ThinQ Live Cloud API</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400">
                  <span>🧪 Chế độ Mô phỏng (Simulator)</span>
                </span>
              )}
            </div>

            <button
              onClick={() => toggleDataSourceMode(isLiveMode ? 'simulator' : 'live_api')}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isLiveMode ? 'Đổi sang Mô phỏng' : 'Đổi sang Live LG API'}
            </button>
          </div>

          {/* Live Notification Banner */}
          {liveNotice && (
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <span>{liveNotice}</span>
            </div>
          )}

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
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {isLiveMode
                        ? 'Máy giặt ở nhà bạn hiện đang TẮT NGUỒN hoặc ở trạng thái CHỜ'
                        : 'Đang ở trạng thái chờ lệnh giặt'}
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

          {/* Quick Actions & Live Sync */}
          <div className="space-y-2">
            {isLiveMode ? (
              <button
                onClick={handleSyncFromLG}
                disabled={isSyncingLive}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <RefreshCw size={14} className={isSyncingLive ? 'animate-spin' : ''} />
                <span>
                  {isSyncingLive ? 'Đang hỏi LG ThinQ Cloud...' : '🔄 Kiểm tra trạng thái máy thật từ LG ThinQ'}
                </span>
              </button>
            ) : isCompleted ? (
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
                onClick={handleStartSimulatedCycle}
                className="w-full py-2 px-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-purple-100 transition"
              >
                <RotateCw size={14} />
                <span>Chạy thử chu trình giặt mô phỏng (30 phút)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Khóa cửa an toàn: {w.doorLocked ? 'Đang khóa' : 'Mở'}</span>
                <span>Lồng giặt: {w.drumCleanCycleCount}/30 lần giặt</span>
              </div>
            )}
          </div>

          {/* Bottom Bar: Power & Clean Status */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/80 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <Zap size={13} className="text-amber-400" />
              <span>{isRunning ? (device.currentWattage || 380) : 0}W (~{device.powerUsageKwhToday || device.powerUsageKwh} kWh/ngày)</span>
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
