import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { PortfolioSummary, AssetClass } from '../../types/investment';
import { ASSET_CLASS_COLORS } from '../../services/investmentCalculator';
import { PieChart as PieChartIcon } from 'lucide-react';

interface AssetAllocationChartProps {
  summary: PortfolioSummary;
}

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({ summary }) => {
  const data = summary.allocationByClass.filter(item => item.value > 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm text-center">
        <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">Chưa có dữ liệu danh mục để phân bổ</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <PieChartIcon size={16} />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Cơ cấu Phân bổ Danh mục
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300">
          {data.length} nhóm tài sản
        </span>
      </div>

      {/* Centered Donut Chart */}
      <div className="w-full h-44 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip 
              formatter={(value: any) => [formatCurrency(Number(value)), 'Giá trị']}
              contentStyle={{
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600
              }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={4}
            >
              {data.map((entry) => (
                <Cell 
                  key={`cell-${entry.assetClass}`} 
                  fill={ASSET_CLASS_COLORS[entry.assetClass as AssetClass] || '#64748b'} 
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300 leading-tight">
            Tỷ trọng
          </span>
          <span className="text-xs font-black text-slate-900 dark:text-white">
            100%
          </span>
        </div>
      </div>

      {/* Legend Cards List: Full width, no text collision, clean & spacious */}
      <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        {data.map((item) => {
          const color = ASSET_CLASS_COLORS[item.assetClass as AssetClass] || '#64748b';
          return (
            <div 
              key={item.assetClass}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 transition hover:border-slate-200 dark:hover:border-slate-700"
            >
              {/* Category indicator & label */}
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div 
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                  style={{ backgroundColor: color }} 
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {item.label}
                </span>
              </div>

              {/* Amount and percentage badge */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                  {formatCurrency(item.value)}
                </span>
                <span 
                  className="text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0 text-center min-w-[42px]"
                  style={{ 
                    backgroundColor: `${color}18`, 
                    color: color 
                  }}
                >
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
