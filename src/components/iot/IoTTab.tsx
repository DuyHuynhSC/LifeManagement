import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Zap, 
  Droplet, 
  Thermometer, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Power,
  ChevronRight
} from 'lucide-react';
import { IoTDevice } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

export const IoTTab: React.FC = () => {
  const { iotDevices, settings } = useAppStore();
  const [devices, setDevices] = useState<IoTDevice[]>(iotDevices);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate minor fluctuation in telemetry data
      setDevices(prev => prev.map(d => {
        if (d.type === 'water_purifier') {
          return {
            ...d,
            lastUpdated: 'Vừa xong',
            metrics: d.metrics.map(m => m.label.includes('TDS đầu ra') ? { ...m, value: String(Math.floor(16 + Math.random() * 4)) } : m)
          };
        }
        if (d.type === 'robot_vacuum') {
          return {
            ...d,
            lastUpdated: 'Vừa xong',
            metrics: d.metrics.map(m => m.label.includes('pin') ? { ...m, value: String(Math.floor(90 + Math.random() * 8)) } : m)
          };
        }
        return { ...d, lastUpdated: 'Vừa xong' };
      }));
      setIsRefreshing(false);
    }, 800);
  };

  const toggleDeviceOnline = (id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, isOnline: !d.isOnline } : d));
  };

  const totalPower = devices.reduce((sum, d) => sum + (d.isOnline ? d.powerUsageKwh : 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('iot_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('iot_subtitle')}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className={`p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition shadow-sm ${
            isRefreshing ? 'animate-spin text-indigo-600' : ''
          }`}
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Energy & Status Overview Banner */}
      <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden space-y-3">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="text-xs text-cyan-100 font-medium">
              {t('iot_power_usage')} ({t('iot_power_today')})
            </div>
            <div className="text-2xl font-black mt-0.5 tracking-tight flex items-center gap-1.5">
              <Zap size={22} className="text-amber-300 animate-pulse" />
              <span>{totalPower.toFixed(2)} kWh</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur">
              {devices.filter(d => d.isOnline).length}/{devices.length} Online
            </span>
          </div>
        </div>

        <div className="text-[11px] text-cyan-100 flex items-center gap-1">
          <CheckCircle2 size={13} />
          <span>{devices.length > 0 ? t('iot_sensors_stable') : t('iot_no_devices')}</span>
        </div>

        <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Device Cards */}
      <div className="space-y-3">
        {devices.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
            <Cpu size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold">{t('iot_empty_state')}</p>
            <p className="text-[11px]">{t('iot_empty_desc')}</p>
          </div>
        ) : (
          devices.map(device => {
          return (
            <div
              key={device.id}
              className={`p-4 rounded-3xl border transition-all ${
                device.isOnline
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              {/* Device Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    device.isOnline
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    {device.type === 'water_purifier' ? <Droplet size={22} /> : <Cpu size={22} />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {device.name}
                    </h3>
                    <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                      <span>{device.location}</span>
                      <span>•</span>
                      <span>{device.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleDeviceOnline(device.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                    device.isOnline
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-rose-100 hover:text-rose-600'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'
                  }`}
                  title={device.isOnline ? 'Nhấn để tắt kết nối' : 'Nhấn để bật kết nối'}
                >
                  <Power size={14} />
                </button>
              </div>

              {/* Metrics Grid */}
              {device.isOnline && (
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  {device.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl text-xs ${
                        m.status === 'warning'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900'
                          : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="text-[10px] text-slate-500 dark:text-slate-300 font-medium truncate">
                        {m.label}
                      </div>
                      <div className={`text-xs font-bold mt-0.5 ${
                        m.status === 'warning' ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {m.value} {m.unit || ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
};
