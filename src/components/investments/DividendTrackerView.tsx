import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { groupDividendsByMonth, ASSET_CLASS_COLORS } from '../../services/investmentCalculator';
import { DividendRecord, InvestmentAsset } from '../../types/investment';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface DividendTrackerViewProps {
  onOpenAddDividend: () => void;
  onOpenEditDividend?: (dividend: DividendRecord) => void;
  onSelectAsset?: (asset: InvestmentAsset) => void;
}

export const DividendTrackerView: React.FC<DividendTrackerViewProps> = ({
  onOpenAddDividend,
  onOpenEditDividend,
  onSelectAsset
}) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const { assets, dividends, deleteDividend, portfolioSummary } = useInvestmentStore();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showChart, setShowChart] = useState<boolean>(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Group monthly cashflow
  const monthlyData = groupDividendsByMonth(dividends, selectedYear);
  const totalInYear = monthlyData.reduce((sum, item) => sum + item.amount, 0);
  const monthlyAvg = Math.round(totalInYear / 12);

  // Overall Yield on Cost
  const avgYieldOnCost = portfolioSummary.totalInvested > 0
    ? (portfolioSummary.totalDividendsReceived / portfolioSummary.totalInvested) * 100
    : 0;

  // Filter dividends by selected year
  const filteredDividends = dividends.filter(d => {
    const dYear = new Date(d.date).getFullYear();
    return dYear === selectedYear;
  });

  const availableYears = Array.from(
    new Set([currentYear, currentYear - 1, ...dividends.map(d => new Date(d.date).getFullYear())])
  ).sort((a, b) => b - a);

  return (
    <div className="space-y-3">
      {/* Passive Income Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 p-3.5 sm:p-4 text-white shadow-lg border border-amber-500/40 space-y-2">
        {/* Top row: Icon, Label & Year Switcher */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <div className="flex items-center gap-1.5 min-w-0 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-100 shrink-0">
              <Coins size={14} />
            </div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-100 truncate">
              {t('inv_div_view_title')}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm p-0.5 rounded-lg border border-white/10 shrink-0">
            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                  selectedYear === yr
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-amber-100/80 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Total Cash Dividends & Sub-stats */}
        <div className="relative z-10 flex items-baseline justify-between gap-2 flex-wrap pt-0.5">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight font-mono tabular-nums">
            +{formatCurrency(portfolioSummary.totalDividendsReceived)}
          </div>
          <div className="text-xs font-bold text-amber-200 font-mono tabular-nums">
            YoC: {avgYieldOnCost.toFixed(2)}%/năm
          </div>
        </div>

        {/* 2 Metric Pills in Year */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15 relative z-10">
          <div className="bg-white/5 rounded-xl p-1.5 sm:p-2 border border-white/5">
            <span className="text-[10px] text-amber-200 font-medium block truncate">
              Năm {selectedYear}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 block truncate font-mono tabular-nums">
              +{formatCurrency(totalInYear)}
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-1.5 sm:p-2 border border-white/5">
            <span className="text-[10px] text-amber-200 font-medium block truncate">
              Trung bình tháng
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 block truncate font-mono tabular-nums">
              +{formatCurrency(monthlyAvg)}
            </span>
          </div>
        </div>

        {/* Bottom Toggle Bar */}
        <div className="pt-1.5 flex items-center justify-between text-[11px] text-amber-100 border-t border-white/15 relative z-10">
          <span className="text-[10px] text-amber-200/90 font-medium truncate">
            {filteredDividends.length} đợt nhận cổ tức năm {selectedYear}
          </span>
          <button
            type="button"
            onClick={() => setShowChart(prev => !prev)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 transition text-[11px] font-semibold text-white backdrop-blur-sm shrink-0"
          >
            <TrendingUp size={11} className="text-amber-300" />
            <span>{showChart ? 'Ẩn biểu đồ' : 'Xem dòng tiền'}</span>
            <ChevronDown size={11} className={`transform transition-transform duration-200 ${showChart ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Monthly Dividend Bar Chart (Toggleable) */}
      {showChart && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{t('inv_div_chart_title')} {selectedYear}</span>
            </h3>
            <button
              onClick={() => setShowChart(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
              title="Thu gọn"
            >
              <span>Thu gọn</span>
              <ChevronUp size={12} />
            </button>
          </div>

          <div className="w-full h-40 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val)), t('inv_div_chart_received')]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 600
                  }}
                  itemStyle={{ color: '#22c55e' }}
                />
                <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.amount > 0 ? '#16A34A' : '#e2e8f0'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Dividend Transactions List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {t('inv_div_log_title', { year: selectedYear })} ({filteredDividends.length})
          </h3>
        </div>

        {filteredDividends.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1.5">
            <Coins size={28} className="mx-auto text-slate-400" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t('inv_div_empty_year', { year: selectedYear })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('inv_div_empty_year_desc')}
            </p>
          </div>
        ) : (
          filteredDividends.map(div => {
            const asset = assets.find(a => a.id === div.assetId);
            const netAmount = div.type === 'cash' ? div.amountOrQuantity - (div.taxDeducted || 0) : div.amountOrQuantity;
            const classColor = asset ? ASSET_CLASS_COLORS[asset.assetClass] || '#f59e0b' : '#f59e0b';

            // Tax rate formatting
            let taxRateStr = '';
            if (div.type === 'cash' && div.taxDeducted && div.taxDeducted > 0) {
              if (div.taxRate !== undefined) {
                taxRateStr = `${div.taxRate}%`;
              } else if (div.amountOrQuantity > 0) {
                if (div.taxDeducted === 5 && div.amountOrQuantity > 1000) {
                  taxRateStr = '5%';
                } else {
                  const r = (div.taxDeducted / div.amountOrQuantity) * 100;
                  taxRateStr = Number.isInteger(r) ? `${r}%` : `${r.toFixed(1)}%`;
                }
              }
            }

            return (
              <div
                key={div.id}
                className="w-full max-w-full overflow-hidden min-w-0 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all space-y-1.5"
              >
                {/* Row 1: Symbol Avatar, Symbol, Tag, Date & Net Amount */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-[11px] shrink-0 shadow-2xs font-mono"
                      style={{ backgroundColor: classColor }}
                    >
                      {asset ? asset.symbol.slice(0, 3).toUpperCase() : 'DIV'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {asset ? asset.symbol : 'Tài sản'}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          div.type === 'cash'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-sky-50 dark:bg-sky-950/60 text-primary-700 dark:text-primary-300 border border-sky-200 dark:border-sky-800'
                        }`}>
                          {div.type === 'cash' ? t('inv_div_badge_cash') : t('inv_div_badge_stock')}
                        </span>
                        {div.reinvested && (
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300 border border-sky-200/50 shrink-0">
                            DRIP
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium font-mono tabular-nums">
                          {div.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Amount */}
                  <div className="shrink-0 text-right">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight whitespace-nowrap font-mono tabular-nums">
                      {div.type === 'cash' ? `+${formatCurrency(netAmount)}` : `+${div.amountOrQuantity.toLocaleString('vi-VN')} ${t('inv_detail_unit_shares')}`}
                    </span>
                  </div>
                </div>

                {/* Row 2: Sub-row: Notes / Gross amount & Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {div.type === 'cash' && div.taxDeducted && div.taxDeducted > 0 && (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono tabular-nums">
                        Thuế {taxRateStr ? `(${taxRateStr})` : ''}: -{formatCurrency(div.taxDeducted)}
                      </span>
                    )}
                    {div.notes && (
                      <span className="italic truncate max-w-[150px] sm:max-w-xs text-slate-400" title={div.notes}>
                        {div.notes.replace(/^["']+|["']+$/g, '')}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                    {onOpenEditDividend && (
                      <button
                        onClick={() => onOpenEditDividend(div)}
                        title={t('inv_div_action_edit')}
                        className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition active:scale-95"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteDividend(div.id)}
                      title="Xóa bản ghi cổ tức"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition active:scale-95"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};