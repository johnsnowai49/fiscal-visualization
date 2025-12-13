import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { FISCAL_DATA } from '../data';
import { Period } from '../types';

const PeriodComparisonChart: React.FC = () => {
  const [period1, setPeriod1] = useState<Period>(Period.P1);
  const [period2, setPeriod2] = useState<Period>(Period.P2);

  const periods = Object.values(Period);

  const getAverageData = (targetPeriod: Period) => {
    const periodData = FISCAL_DATA.filter((d) => d.period === targetPeriod);
    const count = periodData.length;
    if (count === 0) return { revenue: 0, expenditure: 0, debt: 0, infra: 0, social: 0 };

    const sum = periodData.reduce(
      (acc, curr) => ({
        revenue: acc.revenue + curr.totalRevenue,
        expenditure: acc.expenditure + curr.totalExpenditure,
        debt: acc.debt + curr.revenue.debt,
        infra: acc.infra + curr.expenditure.infrastructure,
        social: acc.social + curr.expenditure.socialWelfare,
      }),
      { revenue: 0, expenditure: 0, debt: 0, infra: 0, social: 0 }
    );

    return {
      revenue: Math.round(sum.revenue / count),
      expenditure: Math.round(sum.expenditure / count),
      debt: Math.round(sum.debt / count),
      infra: Math.round(sum.infra / count),
      social: Math.round(sum.social / count),
    };
  };

  const p1Data = useMemo(() => getAverageData(period1), [period1]);
  const p2Data = useMemo(() => getAverageData(period2), [period2]);

  const option = useMemo(() => {
    // Find max value to scale radar chart correctly
    const allValues = [
      ...(Object.values(p1Data) as number[]),
      ...(Object.values(p2Data) as number[]),
    ];
    const maxVal = Math.max(...allValues) * 1.1;

    return {
      title: {
        text: 'Period Average Comparison',
        left: 'center',
        textStyle: { fontSize: 16, color: '#334155' }
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        bottom: 0,
        data: [period1, period2],
      },
      radar: {
        indicator: [
          { name: 'Total Revenue', max: maxVal },
          { name: 'Total Expenditure', max: maxVal },
          { name: 'Debt Issued', max: maxVal },
          { name: 'Infrastructure', max: maxVal },
          { name: 'Social Welfare', max: maxVal },
        ],
        shape: 'circle',
        splitArea: {
            areaStyle: {
                color: ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.1)']
            }
        }
      },
      series: [
        {
          name: 'Period Comparison',
          type: 'radar',
          data: [
            {
              value: Object.values(p1Data),
              name: period1,
              itemStyle: { color: '#3b82f6' },
              areaStyle: { opacity: 0.3 }
            },
            {
              value: Object.values(p2Data),
              name: period2,
              itemStyle: { color: '#f59e0b' },
              areaStyle: { opacity: 0.3 }
            },
          ],
        },
      ],
    };
  }, [p1Data, p2Data, period1, period2]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="flex flex-wrap gap-4 mb-4 justify-center bg-slate-50 p-3 rounded-lg">
        <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1">Base Period</label>
            <select
            className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={period1}
            onChange={(e) => setPeriod1(e.target.value as Period)}
            >
            {periods.map((p) => (
                <option key={`p1-${p}`} value={p}>
                {p}
                </option>
            ))}
            </select>
        </div>
        <div className="flex items-center text-slate-400 font-bold">VS</div>
        <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1">Comparison Period</label>
            <select
            className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={period2}
            onChange={(e) => setPeriod2(e.target.value as Period)}
            >
            {periods.map((p) => (
                <option key={`p2-${p}`} value={p}>
                {p}
                </option>
            ))}
            </select>
        </div>
      </div>
      <div className="flex-grow">
        <ReactECharts option={option} style={{ height: '350px', width: '100%' }} />
      </div>
    </div>
  );
};

export default PeriodComparisonChart;