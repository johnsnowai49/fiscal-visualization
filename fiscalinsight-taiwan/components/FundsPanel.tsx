import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { FundYearData } from '../types';

interface Props {
  data: FundYearData;
}

const FundsPanel: React.FC<Props> = ({ data }) => {
  const option = useMemo(() => {
    // Sort by Income descending and take top 10
    const topFunds = [...data.items]
      .sort((a, b) => b.income - a.income)
      .slice(0, 10);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        bottom: 0,
        data: ['Income', 'Expense']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '25%', // Increased space for rotated labels
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: topFunds.map(f => f.name),
        axisTick: { alignWithLabel: true },
        axisLabel: {
          interval: 0,
          rotate: 30,
          formatter: (value: string) => {
            return value.length > 10 ? value.substring(0, 10) + '...' : value;
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'NT$ (Billions)',
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      series: [
        {
          name: 'Income',
          type: 'bar',
          data: topFunds.map(f => f.income),
          itemStyle: { color: '#10b981' }, // Green
          barGap: 0
        },
        {
          name: 'Expense',
          type: 'bar',
          data: topFunds.map(f => f.expense),
          itemStyle: { color: '#ef4444' } // Red
        }
      ]
    };
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800">4. Funds</h2>
        <p className="text-sm text-slate-500">Fund Performance: Income vs Expense (Year {data.year})</p>
      </div>
      <ReactECharts option={option} style={{ height: '300px', width: '100%' }} />
    </div>
  );
};

export default FundsPanel;
