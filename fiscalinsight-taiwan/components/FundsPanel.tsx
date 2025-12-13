import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { FiscalYearData } from '../types';

interface Props {
  data: FiscalYearData;
}

const FundsPanel: React.FC<Props> = ({ data }) => {
  const option = useMemo(() => {
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
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.funds.map(f => f.name),
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        name: 'Amount (Billions)',
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      series: [
        {
          name: 'Income',
          type: 'bar',
          data: data.funds.map(f => f.income),
          itemStyle: { color: '#10b981' }, // Green
          barGap: 0
        },
        {
          name: 'Expense',
          type: 'bar',
          data: data.funds.map(f => f.expense),
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
