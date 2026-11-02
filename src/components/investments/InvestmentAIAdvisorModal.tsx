import React from 'react';
import {
  Sparkles,
  X,
  ShieldAlert,
  CheckCircle2,
  ArrowUpRight,
  PieChart
} from 'lucide-react';
import { InvestmentAsset, PortfolioSummary, InvestmentTransaction } from '../../types/investment';
import { generatePortfolioInsights } from '../../services/investmentAdvisor';
import { getTranslation } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';

interface InvestmentAIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: InvestmentAsset[];
  portfolioSummary: PortfolioSummary;
  transactions?: InvestmentTransaction[];
  onSelectAsset?: (asset: InvestmentAsset) => void;
}

export const InvestmentAIAdvisorModal: React.FC<InvestmentAIAdvisorModalProps> = ({
  isOpen,
  onClose,
  assets,
  portfolioSummary,
  transactions = [],
  onSelectAsset
}) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  if (!isOpen) return null;

  const { insights, health } = generatePortfolioInsights(assets, portfolioSummary, transactions);

  // Tính sơ bộ % từng nhóm tài sản để vẽ thanh phân bổ nhanh
  const totalVal = portfolioSummary?.currentMarketValue || 1;
  const getClassPct = (cls: string) => {
    const item = portfolioSummary.allocationByClass.find(i => i.assetClass === cls);
    return item ? item.percentage : 0;
  };

  const stockPct = getClassPct('stock');
  const fundPct = getClassPct('fund');
  const savingsPct = getClassPct('savings');
  const goldPct = getClassPct('gold');
  const cryptoPct = getClassPct('crypto');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                {t('dash_ai_suggestions')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân tích Cổ phiếu, CCQ & Sức khỏe danh mục
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Health Score Banner */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900/40 border border-purple-200/80 dark:border-purple-800/60 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('dash_ai_portfolio_health')}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black font-mono text-purple-700 dark:text-purple-300">
                  {health.score}<span className="text-xs font-normal text-slate-400">/100</span>
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${health.badgeColor}`}>
                  {health.label}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                Khuyến nghị AI
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {insights.length} nhận định
              </span>
            </div>
          </div>

          {/* Asset Allocation Mini Pills */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-purple-200/60 dark:border-purple-800/40 text-[10px] font-bold flex-wrap">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <PieChart size={11} /> Tỷ trọng:
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Cổ phiếu: {stockPct}%
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-100/80 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
              CCQ: {fundPct}%
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              Tiết kiệm/Vàng: {(savingsPct + goldPct).toFixed(1)}%
            </span>
            {cryptoPct > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-purple-100/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                Crypto: {cryptoPct}%
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Insights List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
          {insights.map(item => {
            const isWarning = item.type === 'warning';
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  isWarning
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isWarning ? (
                      <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                  </div>

                  {item.metric && (
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                      {item.metric}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.message}
                </p>

                {item.actionText && item.targetAssetId && (
                  <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50">
                    <button
                      onClick={() => {
                        if (item.targetAssetId && onSelectAsset) {
                          const target = assets.find(a => a.id === item.targetAssetId);
                          if (target) {
                            onClose();
                            onSelectAsset(target);
                          }
                        }
                      }}
                      className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{item.actionText}</span>
                      <ArrowUpRight size={11} />
                    </button>

                    {item.priority === 'high' && (
                      <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase">
                        Cần lưu ý
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
