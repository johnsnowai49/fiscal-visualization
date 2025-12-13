import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { FISCAL_DATA } from '../data';

const OverviewChart: React.FC = () => {
  const chartData = useMemo(() => {
    return FISCAL_DATA.map((d, i) => {
      const prev = FISCAL_DATA[i - 1];
      const revGrowth = prev ? ((d.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100 : 0;
      const expGrowth = prev ? ((d.totalExpenditure - prev.totalExpenditure) / prev.totalExpenditure) * 100 : 0;
      
      return {
        ...d,
        revGrowth: revGrowth.toFixed(1),
        expGrowth: expGrowth.toFixed(1)
      };
    });
  }, []);

  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b' },
        formatter: (params: any) => {
          const index = params[0].dataIndex;
          const item = chartData[index];
          let html = `<div class="font-bold mb-2 text-slate-700">Fiscal Year ${item.year}</div>`;
          
          params.forEach((p: any) => {
             const growth = p.seriesName === 'Total Revenue' ? item.revGrowth : item.expGrowth;
             const colorClass = parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600';
             const sign = parseFloat(growth) >= 0 ? '+' : '';
             
             html += `
              <div class="flex justify-between items-center gap-4 mb-1 text-sm">
                <div class="flex items-center gap-2">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${p.color}"></span>
                  <span>${p.seriesName}</span>
                </div>
                <div class="text-right">
                  <span class="font-semibold block">$${p.value}B</span>
                  <span class="text-xs ${colorClass}">(${sign}${growth}%)</span>
                </div>
              </div>
             `;
          });
          return html;
        }
      },
      legend: {
        data: ['Total Revenue', 'Total Expenditure'],
        bottom: 0,
        icon: 'circle'
      },
      grid: {
        left: '2%',
        right: '2%',
        bottom: '10%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.map((d) => `Y${d.year}`),
        axisLine: { lineStyle: { color: '#94a3b8' } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
        axisLabel: { color: '#64748b' }
      },
      series: [
        {
          name: 'Total Revenue',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: chartData.map((d) => d.totalRevenue),
          itemStyle: { color: '#10b981' }, // Emerald
          lineStyle: { width: 3 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0)' },
              ],
            },
          },
        },
        {
          name: 'Total Expenditure',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: chartData.map((d) => d.totalExpenditure),
          itemStyle: { color: '#f43f5e' }, // Rose
          lineStyle: { width: 3 },
           areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(244, 63, 94, 0.2)' },
                { offset: 1, color: 'rgba(244, 63, 94, 0)' },
              ],
            },
          },
        },
      ],
    };
  }, [chartData]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-1">1. Overview</h2>
      <p className="text-sm text-slate-500 mb-4">Total Revenue vs Expenditure Trends (YoY Change)</p>
      <ReactECharts option={option} style={{ height: '350px', width: '100%' }} />
    </div>
  );
};

export default OverviewChart;
