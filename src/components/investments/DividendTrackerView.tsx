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
  Plus, 
  Trash2, 
  ArrowUpRight, 
  Clock, 
  Sparkles,
  PieChart
} from 'lucide-react';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { groupDividendsByMonth } from '../../services/investmentCalculator';
import { DividendRecord, InvestmentAsset } from '../../types/investment';

interface DividendTrackerViewProps {
  onOpenAddDividend: () => void;
  onSelectAsset?: (asset: InvestmentAsset) => void;
}

export const DividendTrackerView: React.FC<DividendTrackerViewProps> = ({
  onOpenAddDividend,
  onSelectAsset
}) => {
  const { assets, dividends, deleteDividend, portfolioSummary } = useInvestmentStore();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

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
    <div className="space-y-4">
      {/* Passive Income Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 p-5 text-white shadow-xl border border-amber-500/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-100">
              <Coins size={18} />
            </div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-100">
              Dòng tiền Cổ tức & Lợi tức
            </span>
          </div>

          <button
            onClick={onOpenAddDividend}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-xl backdrop-blur-sm border border-white/20 transition"
          >
            <Plus size={14} />
            <span>Ghi nhận cổ tức</span>
          </button>
        </div>

        {/* Total Cash Dividends */}
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            +{formatCurrency(portfolioSummary.totalDividendsReceived)}
          </div>
          <p className="text-xs text-amber-100 font-medium mt-0.5">
            Tổng thu nhập thụ động đã tích lũy toàn bộ thời gian
          </p>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/15">
          <div>
            <span className="text-[11px] text-amber-200 font-medium block">
              Trong năm {selectedYear}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 block">
              +{formatCurrency(totalInYear)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-amber-200 font-medium block">
              TB mỗi tháng
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 block">
              +{formatCurrency(monthlyAvg)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-amber-200 font-medium block">
              Tỷ suất (YoC)
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-amber-200 mt-0.5 block">
              {avgYieldOnCost.toFixed(2)}%/năm
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Dividend Bar Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Biểu đồ Dòng tiền 12 Tháng</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
              Dòng tiền cổ tức thực thu theo từng tháng
            </p>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/80 p-1 rounded-xl">
            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  selectedYear === yr
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-44 sm:h-52 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(val: any) => [formatCurrency(Number(val)), 'Cổ tức thực thu']}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600
                }}
                itemStyle={{ color: '#fbbf24' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.amount > 0 ? '#f59e0b' : '#e2e8f0'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dividend Transactions List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Nhật ký Nhận Cổ tức năm {selectedYear} ({filteredDividends.length})
          </h3>
          <button
            onClick={onOpenAddDividend}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
          >
            <Plus size={14} />
            <span>Thêm cổ tức</span>
          </button>
        </div>

        {filteredDividends.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <Coins size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Chưa có khoản cổ tức nào trong năm {selectedYear}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Nhấn "+ Ghi nhận cổ tức" để lưu lại các khoản chia cổ tức hoặc lãi gửi tiết kiệm.
            </p>
          </div>
        ) : (
          filteredDividends.map(div => {
            const asset = assets.find(a => a.id === div.assetId);
            const netAmount = div.type === 'cash' ? div.amountOrQuantity - (div.taxDeducted || 0) : div.amountOrQuantity;

            return (
              <div
                key={div.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                    {asset ? asset.symbol.slice(0, 3) : 'DIV'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {asset ? asset.symbol : 'Tài sản'}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        div.type === 'cash'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}>
                        {div.type === 'cash' ? 'TIỀN MẶT' : 'CỔ PHIẾU'}
                      </span>
                      {div.reinvested && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                          DRIP
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-300 font-medium mt-0.5 flex items-center gap-2">
                      <span>{div.date}</span>
                      {div.taxDeducted && div.taxDeducted > 0 ? (
                        <span>Thuế: {formatCurrency(div.taxDeducted)}</span>
                      ) : null}
                      {div.notes && <span className="italic truncate max-w-[130px]">({div.notes})</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400 block">
                      {div.type === 'cash' ? `+${formatCurrency(netAmount)}` : `+${div.amountOrQuantity} CP`}
                    </span>
                    {div.type === 'cash' && div.taxDeducted && div.taxDeducted > 0 ? (
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Gốc: {formatCurrency(div.amountOrQuantity)}
                      </span>
                    ) : null}
                  </div>

                  <button
                    onClick={() => deleteDividend(div.id)}
                    title="Xóa bản ghi cổ tức"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
