import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { FISCAL_DATA } from '../data';

const CompositionChart: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(12);

  const yearData = useMemo(() => {
    return FISCAL_DATA.find((d) => d.year === selectedYear) || FISCAL_DATA[0];
  }, [selectedYear]);

  const option = useMemo(() => {
    return {
      title: {
        text: `Fiscal Composition (Year ${selectedYear})`,
        left: 'center',
        subtext: yearData.period,
        textStyle: { fontSize: 16, color: '#334155' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 }
      },
      series: [
        {
          name: 'Revenue Source',
          type: 'pie',
          selectedMode: 'single',
          radius: ['40%', '60%'],
          center: ['25%', '50%'],
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}',
            fontSize: 10
          },
          labelLine: { show: true, length: 5 },
          data: [
            { value: yearData.revenue.tax, name: 'Tax', itemStyle: { color: '#0ea5e9' } },
            { value: yearData.revenue.fees, name: 'Fees', itemStyle: { color: '#6366f1' } },
            { value: yearData.revenue.debt, name: 'Debt', itemStyle: { color: '#f43f5e' } },
            { value: yearData.revenue.other, name: 'Other', itemStyle: { color: '#94a3b8' } },
          ],
        },
        {
          name: 'Expenditure',
          type: 'pie',
          radius: ['40%', '60%'],
          center: ['75%', '50%'],
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}',
            fontSize: 10
          },
          labelLine: { show: true, length: 5 },
          data: [
            { value: yearData.expenditure.education, name: 'Edu', itemStyle: { color: '#10b981' } },
            { value: yearData.expenditure.defense, name: 'Defense', itemStyle: { color: '#f97316' } },
            { value: yearData.expenditure.socialWelfare, name: 'Social', itemStyle: { color: '#ec4899' } },
            { value: yearData.expenditure.infrastructure, name: 'Infra', itemStyle: { color: '#8b5cf6' } },
            { value: yearData.expenditure.administration, name: 'Admin', itemStyle: { color: '#64748b' } },
          ],
        },
      ],
    };
  }, [yearData, selectedYear]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="mb-4">
        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide text-center">
            Select Fiscal Year
        </label>
        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
            <span className="text-xs font-bold text-slate-400">Y1</span>
            <input
                type="range"
                min="1"
                max="12"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full mx-3 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-xs font-bold text-slate-400">Y12</span>
        </div>
        <div className="text-center mt-1 text-blue-600 font-bold">
            Year {selectedYear}
        </div>
      </div>
      
      <div className="flex-grow relative">
        <div className="absolute top-0 left-[25%] -translate-x-1/2 text-xs font-bold text-slate-400">Revenue</div>
        <div className="absolute top-0 left-[75%] -translate-x-1/2 text-xs font-bold text-slate-400">Expenditure</div>
        <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />
      </div>
    </div>
  );
};

export default CompositionChart;
