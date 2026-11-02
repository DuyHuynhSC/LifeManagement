import React from 'react';
import { X, AlertTriangle, ShieldAlert, Wrench, ChevronRight, Pill, Calendar, Clock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface AlertsModalProps {
  onClose: () => void;
  onSelectAsset: (assetId: string) => void;
  onOpenMedicineCabinet?: () => void;
  onOpenRecurringBills?: () => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({ 
  onClose, 
  onSelectAsset,
  onOpenMedicineCabinet,
  onOpenRecurringBills
}) => {
  const { assets, settings, medicineItems, recurringBills } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 1. Warranty expiring items
  const warrantyExpiringAssets = assets.filter(asset => {
    const exp = new Date(asset.warrantyExpiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= settings.notifyDaysBeforeExpiry;
  });

  // 2. Components wearing out (wear <= 20%)
  const urgentComponents: { assetId: string; assetName: string; compName: string; wear: number; cost: number }[] = [];
  assets.forEach(asset => {
    asset.components.forEach(comp => {
      if (comp.currentWearPercent <= 20) {
        urgentComponents.push({
          assetId: asset.id,
          assetName: asset.name,
          compName: comp.name,
          wear: comp.currentWearPercent,
          cost: comp.replacementCost
        });
      }
    });
  });

  // 3. Urgent Recurring Bills (quá hạn hoặc đến hạn <= 5 ngày)
  const urgentBills = recurringBills.map(b => {
    const due = new Date(b.nextDueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { ...b, diffDays };
  }).filter(b => b.diffDays <= (settings.notifyDaysBeforeExpiry || 5));

  // 4. Urgent Medicine Items (quá hạn hoặc hết hạn trong vòng 30 ngày)
  const urgentMedicines = medicineItems.map(m => {
    const exp = new Date(m.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { ...m, diffDays };
  }).filter(m => m.diffDays <= 30);

  const totalUrgent = warrantyExpiringAssets.length + urgentComponents.length + urgentBills.length + urgentMedicines.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl md:rounded-3xl p-4 shadow-2xl space-y-3 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <AlertTriangle size={18} />
            <span>Thông báo khẩn <span className="font-mono tabular-nums">({totalUrgent})</span></span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Cảnh báo bảo hành, linh kiện, hóa đơn và thuốc cần chú ý:
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pt-1 text-xs">
          {totalUrgent === 0 ? (
            <div className="text-center py-6 text-slate-400">
              Không có cảnh báo nào trong ngưỡng thời gian hiện tại.
            </div>
          ) : (
            <>
              {/* Thuốc hết hạn / sắp hết hạn */}
              {urgentMedicines.map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    onClose();
                    onOpenMedicineCabinet?.();
                  }}
                  className="p-3 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 rounded-2xl flex items-center justify-between cursor-pointer hover:border-rose-400 transition shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
                      <Pill size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{m.name}</span>
                        <span className="text-[9px] font-black bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200 px-1.5 rounded">
                          Tủ thuốc
                        </span>
                      </div>
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold font-mono tabular-nums">
                        {m.diffDays < 0 ? `ĐÃ HẾT HẠN (${Math.abs(m.diffDays)} ngày trước)` : `Hết hạn sau ${m.diffDays} ngày (${m.expiryDate})`}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              ))}

              {/* Hóa đơn định kỳ sắp đến hạn / quá hạn */}
              {urgentBills.map(b => (
                <div
                  key={b.id}
                  onClick={() => {
                    onClose();
                    onOpenRecurringBills?.();
                  }}
                  className="p-3 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-900/60 rounded-2xl flex items-center justify-between cursor-pointer hover:border-teal-400 transition shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{b.title}</span>
                        <span className="text-[9px] font-black bg-teal-200 text-teal-800 dark:bg-teal-900 dark:text-teal-200 px-1.5 rounded font-mono">
                          {b.amount.toLocaleString()} ₫
                        </span>
                      </div>
                      <div className={`text-[11px] font-semibold font-mono tabular-nums ${b.diffDays < 0 ? 'text-rose-600' : 'text-teal-700 dark:text-teal-300'}`}>
                        {b.diffDays < 0 ? `Quá hạn ${Math.abs(b.diffDays)} ngày!` : `Đến hạn sau ${b.diffDays} ngày (${b.nextDueDate})`}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              ))}

              {/* Bảo hành thiết bị */}
              {warrantyExpiringAssets.map(a => {
                const diff = Math.ceil((new Date(a.warrantyExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      onSelectAsset(a.id);
                      onClose();
                    }}
                    className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                        <ShieldAlert size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold font-mono tabular-nums">
                          Hạn bảo hành: còn {diff} ngày ({a.warrantyExpiryDate})
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                );
              })}

              {/* Linh kiện thiết bị */}
              {urgentComponents.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectAsset(c.assetId);
                    onClose();
                  }}
                  className="p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-between cursor-pointer hover:border-rose-400 transition shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
                      <Wrench size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{c.compName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        Thuộc {c.assetName} • Còn <strong className="text-rose-600">{c.wear}%</strong>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              ))}
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

