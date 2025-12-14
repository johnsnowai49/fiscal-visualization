import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { OverviewSection, CategoryItem } from '../types';

interface Props {
  data: OverviewSection;
  year: number;
}

const SpendersPanel: React.FC<Props> = ({ data, year }) => {
  const total = data.total;

  // Map simulated keys to Agency names
  const agencies = Object.values(data.breakdown).map((item: CategoryItem) => ({
    name: item.abbr || item.name,
    fullName: item.name,
    value: item.amount
  }));

  // Sort for Ranking Bar Chart
  const rankedAgencies = [...agencies].sort((a, b) => a.value - b.value); // Ascending for bar chart y-axis

  const donutOption = useMemo(() => ({
    color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    tooltip: { trigger: 'item', formatter: '{b}: <br/>NT${c}B ({d}%)' },
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
        data: agencies.map(a => ({ value: a.value, name: a.name }))
      }
    ]
  }), [agencies]);

  const barOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: '5%', left: '3%', right: '15%', bottom: '5%', containLabel: true },
    xAxis: { type: 'value', splitLine: { show: false } },
    yAxis: {
      type: 'category',
      data: rankedAgencies.map(a => a.name),
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: rankedAgencies.map(a => a.value),
        itemStyle: { color: '#6366f1', borderRadius: [0, 4, 4, 0] },
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            const percent = ((params.value / total) * 100).toFixed(1);
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
        <h2 className="text-lg font-bold text-slate-800">2. Spenders</h2>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-800">2. Spenders</h2>
          <p className="text-sm text-slate-500">Expenditure Breakdown by Agency (Year {year})</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Composition */}
        <div className="h-64">
          <h3 className="text-xs font-semibold text-center text-slate-400 uppercase tracking-wider mb-2">Composition</h3>
          <ReactECharts option={donutOption} style={{ height: '100%', width: '100%' }} />
        </div>

        {/* Ranking */}
        <div className="h-64">
          <h3 className="text-xs font-semibold text-center text-slate-400 uppercase tracking-wider mb-2">Top Spenders Ranking</h3>
          <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};

export default SpendersPanel;
