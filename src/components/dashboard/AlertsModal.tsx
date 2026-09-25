import React from 'react';
import { X, AlertTriangle, ShieldAlert, Wrench, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface AlertsModalProps {
  onClose: () => void;
  onSelectAsset: (assetId: string) => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({ onClose, onSelectAsset }) => {
  const { assets, settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const today = new Date();
  
  // 1. Warranty expiring items
  const warrantyExpiringAssets = assets.filter(asset => {
    const exp = new Date(asset.warrantyExpiryDate);
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

  const totalUrgent = warrantyExpiringAssets.length + urgentComponents.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl md:rounded-3xl p-4 shadow-2xl space-y-3 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <AlertTriangle size={18} />
            <span>Thông báo khẩn ({totalUrgent})</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Danh sách thiết bị sắp hết bảo hành hoặc linh kiện cần thay thế trong vòng <strong>{settings.notifyDaysBeforeExpiry} ngày</strong>:
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pt-1 text-xs">
          {totalUrgent === 0 ? (
            <div className="text-center py-6 text-slate-400">
              Không có cảnh báo nào trong ngưỡng thời gian hiện tại.
            </div>
          ) : (
            <>
              {warrantyExpiringAssets.map(a => {
                const diff = Math.ceil((new Date(a.warrantyExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      onSelectAsset(a.id);
                      onClose();
                    }}
                    className="p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-between cursor-pointer hover:border-rose-400 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                        <ShieldAlert size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                          Hạn bảo hành: còn {diff} ngày ({a.warrantyExpiryDate})
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                );
              })}

              {urgentComponents.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectAsset(c.assetId);
                    onClose();
                  }}
                  className="p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-between cursor-pointer hover:border-rose-400 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
                      <Wrench size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{c.compName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
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
