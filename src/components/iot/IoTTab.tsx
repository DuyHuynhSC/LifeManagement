import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  Plus, 
  Settings, 
  AlertTriangle,
  Receipt,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { IoTDevice } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { WaterPurifierCard } from './WaterPurifierCard';
import { FridgeCard } from './FridgeCard';
import { WasherCard } from './WasherCard';
import { GenericDeviceCard } from './GenericDeviceCard';
import { AddDeviceModal } from './AddDeviceModal';
import { CloudConfigModal } from './CloudConfigModal';
import { initialIoTDevices } from '../../data/initialData';

export const IoTTab: React.FC = () => {
  const { 
    iotDevices, 
    settings, 
    addIoTDevice, 
    updateIoTDevice, 
    deleteIoTDevice, 
    toggleIoTDeviceOnline,
    setIoTDevices,
    syncIoTTelemetry,
    createTaskFromIoT,
    convertIoTEnergyToExpense
  } = useAppStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [expenseSuccessNotice, setExpenseSuccessNotice] = useState<string | null>(null);

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  // Auto-refresh telemetry simulation every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      syncIoTTelemetry();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    syncIoTTelemetry();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleCreateTask = (deviceId: string, title: string, xp: number = 15) => {
    createTaskFromIoT(deviceId, title, xp);
    alert(`Đã tự động tạo việc nhà: "${title}" (+${xp} XP) vào mục Cộng tác & Việc nhà!`);
  };

  const handleConvertExpense = () => {
    const res = convertIoTEnergyToExpense();
    setExpenseSuccessNotice(
      `Đã ghi nhận ${res.amount.toLocaleString()}đ (${res.kwh.toFixed(1)} kWh) vào Quản lý Chi tiêu!`
    );
    setTimeout(() => {
      setExpenseSuccessNotice(null);
    }, 4000);
  };

  const handleLoadDefaults = () => {
    setIoTDevices(initialIoTDevices);
  };

  // Calculations
  const electricityPrice = settings.electricityPricePerKwh || 2500;
  const totalPowerToday = iotDevices.reduce(
    (sum, d) => sum + (d.isOnline ? (d.powerUsageKwhToday || d.powerUsageKwh || 0) : 0),
    0
  );
  const totalPowerMonth = iotDevices.reduce(
    (sum, d) => sum + (d.isOnline ? (d.powerUsageKwhMonth || (d.powerUsageKwhToday || d.powerUsageKwh || 0) * 30) : 0),
    0
  );
  const estimatedCostMonth = Math.round(totalPowerMonth * electricityPrice);

  // Active alerts across devices
  const allAlerts = iotDevices
    .filter(d => d.isOnline && d.alerts && d.alerts.length > 0)
    .flatMap(d => (d.alerts || []).map(a => ({ device: d, alert: a })))
    .filter(item => !item.alert.taskCreated);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('iot_title')}
            </h1>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('iot_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm"
            title="Cài đặt Cloud API & Đơn giá điện"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={handleRefresh}
            className={`p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-600 transition shadow-sm ${
              isRefreshing ? 'animate-spin text-cyan-600' : ''
            }`}
            title="Làm mới Telemetry"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
          >
            <Plus size={16} />
            <span>{t('iot_add_device')}</span>
          </button>
        </div>
      </div>

      {/* Energy & Monthly Cost Banner */}
      <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden space-y-3.5">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="text-xs text-cyan-100 font-medium">
              Điện năng tiêu thụ hôm nay & tháng này
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <div className="text-2xl font-black tracking-tight flex items-center gap-1.5">
                <Zap size={22} className="text-amber-300 fill-amber-300 animate-pulse" />
                <span>{totalPowerToday.toFixed(2)} kWh</span>
              </div>
              <span className="text-xs text-cyan-200 font-semibold">
                (Tháng: {totalPowerMonth.toFixed(1)} kWh)
              </span>
            </div>

            {/* Tiền điện ước tính */}
            <div className="mt-1 text-xs text-cyan-100 flex items-center gap-1.5">
              <Receipt size={13} className="text-amber-300" />
              <span>Tiền điện ước tính: </span>
              <strong className="text-amber-300 font-extrabold text-sm">
                {estimatedCostMonth.toLocaleString()} ₫
              </strong>
              <span className="text-[10px] text-cyan-200">
                ({electricityPrice.toLocaleString()}đ/kWh)
              </span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur">
              {iotDevices.filter(d => d.isOnline).length}/{iotDevices.length} Online
            </span>

            {/* Nút Ghi vào Chi tiêu */}
            {iotDevices.length > 0 && (
              <button
                onClick={handleConvertExpense}
                className="px-3 py-1.5 rounded-xl bg-white text-indigo-700 hover:bg-cyan-50 font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
                title="Tự động thêm khoản chi phí này vào Quản lý Chi tiêu"
              >
                <Sparkles size={13} className="text-indigo-600" />
                <span>{t('iot_record_expense')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Thông báo ghi chi tiêu thành công */}
        {expenseSuccessNotice && (
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur border border-white/30 text-xs font-semibold text-white flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
            <span>{expenseSuccessNotice}</span>
          </div>
        )}

        <div className="text-[11px] text-cyan-100 flex items-center justify-between border-t border-white/10 pt-2.5">
          <div className="flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>
              {iotDevices.length > 0 ? t('iot_sensors_stable') : t('iot_no_devices')}
            </span>
          </div>
          <span className="text-[10px] text-cyan-200">Tự động đồng bộ mỗi 15s</span>
        </div>

        <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Active Smart Alerts (nếu có cảnh báo từ máy lọc nước, máy giặt, tủ lạnh) */}
      {allAlerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-500" />
            <span>Cảnh báo & Tự động hóa thông minh ({allAlerts.length})</span>
          </h2>

          <div className="space-y-2">
            {allAlerts.map(({ device, alert }) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                  alert.level === 'danger'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{device.name}</span>
                    <span className="text-[10px] font-normal opacity-70">• {alert.timestamp}</span>
                  </div>
                  <p className="mt-0.5 text-[11px]">{alert.message}</p>
                </div>

                <button
                  onClick={() => handleCreateTask(device.id, alert.actionRequired || alert.message, 15)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-current font-bold text-[11px] shrink-0 hover:bg-slate-50 transition"
                >
                  Tạo việc nhà (+15 XP)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Devices List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Danh sách thiết bị kết nối ({iotDevices.length})
          </h2>

          {iotDevices.length === 0 && (
            <button
              onClick={handleLoadDefaults}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              + Nạp thiết bị mẫu của gia đình
            </button>
          )}
        </div>

        {iotDevices.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-3">
            <Cpu size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                Chưa có thiết bị thông minh nào được kết nối
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Hỗ trợ kết nối máy lọc nước (Tuya/Karofi), tủ lạnh (SmartThings), máy giặt (LG ThinQ) để giám sát và tự động nhắc việc, bảo dưỡng.
              </p>
            </div>
            <button
              onClick={handleLoadDefaults}
              className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition inline-flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Nạp ngay thiết bị của nhà tôi (Tủ lạnh, Máy giặt, Máy lọc nước)</span>
            </button>
          </div>
        ) : (
          iotDevices.map(device => {
            if (device.type === 'water_purifier') {
              return (
                <WaterPurifierCard
                  key={device.id}
                  device={device}
                  onTogglePower={toggleIoTDeviceOnline}
                  onDelete={deleteIoTDevice}
                  onCreateTask={handleCreateTask}
                  isLinkedToAsset={Boolean(device.linkedAssetId)}
                />
              );
            }
            if (device.type === 'fridge') {
              return (
                <FridgeCard
                  key={device.id}
                  device={device}
                  onTogglePower={toggleIoTDeviceOnline}
                  onDelete={deleteIoTDevice}
                  onUpdateMetrics={updateIoTDevice}
                  onCreateTask={handleCreateTask}
                  isLinkedToAsset={Boolean(device.linkedAssetId)}
                />
              );
            }
            if (device.type === 'washing_machine') {
              return (
                <WasherCard
                  key={device.id}
                  device={device}
                  onTogglePower={toggleIoTDeviceOnline}
                  onDelete={deleteIoTDevice}
                  onUpdateMetrics={updateIoTDevice}
                  onCreateTask={handleCreateTask}
                  isLinkedToAsset={Boolean(device.linkedAssetId)}
                />
              );
            }
            return (
              <GenericDeviceCard
                key={device.id}
                device={device}
                onTogglePower={toggleIoTDeviceOnline}
                onDelete={deleteIoTDevice}
                isLinkedToAsset={Boolean(device.linkedAssetId)}
              />
            );
          })
        )}
      </div>

      {/* Modals */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addIoTDevice}
      />

      <CloudConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
};
