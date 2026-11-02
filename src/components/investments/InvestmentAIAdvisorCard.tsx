import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { InvestmentAsset, PortfolioSummary, InvestmentTransaction } from '../../types/investment';
import { generatePortfolioInsights } from '../../services/investmentAdvisor';
import { getTranslation } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';

interface InvestmentAIAdvisorCardProps {
  assets: InvestmentAsset[];
  portfolioSummary: PortfolioSummary;
  transactions?: InvestmentTransaction[];
  onSelectAsset?: (asset: InvestmentAsset) => void;
}

export const InvestmentAIAdvisorCard: React.FC<InvestmentAIAdvisorCardProps> = ({
  assets,
  portfolioSummary,
  transactions = [],
  onSelectAsset
}) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);
  const [isExpanded, setIsExpanded] = useState(false);

  const { insights, health } = generatePortfolioInsights(assets, portfolioSummary, transactions);

  if (assets.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-sky-500/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/40 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center justify-between gap-2 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase">
                {t('dash_ai_suggestions')}
              </span>
              <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                {health.score}/100
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Đánh giá phân bổ Cổ phiếu, CCQ & Rủi ro danh mục
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${health.badgeColor}`}>
            {health.label}
          </span>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-2 pt-1">
        {(isExpanded ? insights : insights.slice(0, 1)).map(item => {
          const isWarning = item.type === 'warning';
          return (
            <div
              key={item.id}
              onClick={() => {
                if (item.targetAssetId && onSelectAsset) {
                  const target = assets.find(a => a.id === item.targetAssetId);
                  if (target) onSelectAsset(target);
                }
              }}
              className={`p-3 rounded-xl border transition text-xs ${
                isWarning
                  ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50'
                  : 'bg-white/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80'
              } ${item.targetAssetId ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
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

              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {item.message}
              </p>

              {item.actionText && (
                <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  <span className="inline-flex items-center gap-1 hover:underline">
                    {item.actionText} <ArrowUpRight size={11} />
                  </span>
                  {item.priority === 'high' && (
                    <span className="text-[9px] text-rose-600 dark:text-rose-400 uppercase font-black">
                      Ưu tiên
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand / Collapse text hint if multiple insights */}
      {insights.length > 1 && (
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="w-full text-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 py-0.5 transition"
        >
          {isExpanded ? 'Thu gọn nhận định' : `Xem thêm ${insights.length - 1} nhận định khác...`}
        </button>
      )}
    </div>
  );
};
