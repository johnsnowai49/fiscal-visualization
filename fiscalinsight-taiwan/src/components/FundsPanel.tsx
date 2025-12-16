import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { FundYearData } from '../types';

interface Props {
  data: FundYearData;
  allData: FundYearData[];
}

const FundsPanel: React.FC<Props> = ({ data, allData }) => {
  // 1. Ranking Chart (Bar) - Top 10 Special Funds
  const barOption = useMemo(() => {
    // Sort by Income descending and take top 10 from Special Funds details
    const topFunds = [...data.special_fund.details]
      .sort((a, b) => b.revenue - a.revenue)
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
        bottom: '25%',
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
            return value.length > 8 ? value.substring(0, 8) + '...' : value;
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
          data: topFunds.map(f => f.revenue),
          itemStyle: { color: '#10b981' },
          barGap: 0
        },
        {
          name: 'Expense',
          type: 'bar',
          data: topFunds.map(f => f.expenditure),
          itemStyle: { color: '#ef4444' }
        }
      ]
    };
  }, [data]);

  // 2. Trend Chart (Line) - All Years (Basic + Special)
  const lineOption = useMemo(() => {
    const chartData = allData.map(d => {
      const totalRev = d.basic_fund.total.revenue + d.special_fund.total.revenue;
      const totalExp = d.basic_fund.total.expenditure + d.special_fund.total.expenditure;
      return {
        year: d.year,
        revenue: totalRev,
        expenditure: totalExp
      };
    });

    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0, data: ['Total Revenue', 'Total Expenditure'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.map(d => d.year)
      },
      yAxis: { type: 'value', name: 'NT$ (Billions)' },
      series: [
        {
          name: 'Total Revenue',
          type: 'line',
          smooth: true,
          data: chartData.map(d => d.revenue),
          itemStyle: { color: '#3b82f6' },
          areaStyle: { opacity: 0.1 }
        },
        {
          name: 'Total Expenditure',
          type: 'line',
          smooth: true,
          data: chartData.map(d => d.expenditure),
          itemStyle: { color: '#f97316' },
          areaStyle: { opacity: 0.1 }
        }
      ]
    };
  }, [allData]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">4. Funds Overview</h2>
        <p className="text-sm text-slate-500">Analysis of Basic & Special Funds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-4">Overall Trend (Revenue vs Expense)</h3>
          <ReactECharts option={lineOption} style={{ height: '300px', width: '100%' }} />
        </div>

        {/* Ranking */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-4">Top 10 Special Funds ({data.year})</h3>
          <ReactECharts option={barOption} style={{ height: '300px', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};

export default FundsPanel;
