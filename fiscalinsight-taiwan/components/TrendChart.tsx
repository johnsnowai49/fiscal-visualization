import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { FISCAL_DATA } from '../data';

const TrendChart: React.FC = () => {
  const option = useMemo(() => {
    return {
      title: {
        text: '12-Year Fiscal Overview',
        subtext: 'Revenue vs. Expenditure Trends across Administrations',
        left: 'left',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['Total Revenue', 'Total Expenditure'],
        right: 10,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: FISCAL_DATA.map((d) => `Y${d.year}`),
      },
      yAxis: {
        type: 'value',
        name: 'Amount (Billions)',
        splitLine: {
          lineStyle: { type: 'dashed' },
        },
      },
      series: [
        {
          name: 'Total Revenue',
          type: 'line',
          smooth: true,
          data: FISCAL_DATA.map((d) => d.totalRevenue),
          itemStyle: { color: '#10b981' }, // Emerald 500
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
              ],
            },
          },
          markArea: {
            itemStyle: {
              color: 'rgba(200, 200, 200, 0.1)',
            },
            data: [
              [
                { xAxis: 'Y1', name: 'Period 1' },
                { xAxis: 'Y4' },
              ],
              [
                { xAxis: 'Y5', name: 'Period 2', itemStyle: { color: 'rgba(59, 130, 246, 0.05)' } },
                { xAxis: 'Y8' },
              ],
              [
                { xAxis: 'Y9', name: 'Period 3' },
                { xAxis: 'Y12' },
              ],
            ],
            label: {
              position: 'top',
              color: '#64748b',
              fontSize: 12,
            },
          },
        },
        {
          name: 'Total Expenditure',
          type: 'line',
          smooth: true,
          data: FISCAL_DATA.map((d) => d.totalExpenditure),
          itemStyle: { color: '#ef4444' }, // Red 500
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <ReactECharts option={option} style={{ height: '400px', width: '100%' }} />
    </div>
  );
};

export default TrendChart;
