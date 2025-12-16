import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CategoryItem } from '../types';

interface Props {
  data: CategoryItem[];
  total: number;
  year: number;
}

const SpendersPanel: React.FC<Props> = ({ data, total, year }) => {
  // Map Agency names
  const agencies = data.map((item: CategoryItem) => ({
    name: item.name,
    fullName: item.name,
    value: item.amount
  }));

  // Sort for Ranking Bar Chart
  const rankedAgencies = [...agencies].sort((a, b) => a.value - b.value); // Ascending for bar chart y-axis

  // Donut Data: Top 5 + Others
  const donutData = useMemo(() => {
    const sorted = [...agencies].sort((a, b) => b.value - a.value);
    if (sorted.length <= 5) return sorted;
    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    return [...top5, { name: '其他', fullName: '其他', value: others }];
  }, [agencies]);

  const donutOption = useMemo(() => ({
    color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#cbd5e1'],
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const val = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TWD', notation: "compact", maximumFractionDigits: 1 }).format(params.value);
        return `${params.name}: <br/>${val} (${params.percent}%)`;
      }
    },
    legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } },
    series: [
      {
        name: 'Spending',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: donutData.map(a => ({ value: a.value * 1000, name: a.name }))
      }
    ]
  }), [donutData]);

  const barOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: '5%', left: '3%', right: '20%', bottom: '5%', containLabel: true },
    xAxis: { show: false },
    yAxis: {
      type: 'category',
      data: rankedAgencies.map(a => a.name),
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: rankedAgencies.map(a => a.value * 1000),
        itemStyle: { color: '#6366f1', borderRadius: [0, 4, 4, 0] },
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            const percent = ((params.value / (total * 1000)) * 100).toFixed(1);
            return `${percent}%`;
          },
          fontWeight: 'bold',
          color: '#64748b'
        }
      }
    ]
  }), [rankedAgencies, total]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800">2. 支出</h2>
        <p className="text-sm text-slate-500">各支出分類比例 (年度 {year})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Composition */}
        <div className="h-64">
          <h3 className="text-xs font-semibold text-center text-slate-400 uppercase tracking-wider mb-2">支出結構</h3>
          <ReactECharts option={donutOption} style={{ height: '100%', width: '100%' }} />
        </div>

        {/* Ranking */}
        <div className="h-64">
          <h3 className="text-xs font-semibold text-center text-slate-400 uppercase tracking-wider mb-2">支出排行</h3>
          <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};

export default SpendersPanel;
