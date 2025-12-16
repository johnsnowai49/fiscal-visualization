import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { FundYearData } from '../types';

interface Props {
  data: FundYearData;
  allData: FundYearData[];
  year: number;
}

const FundsPanel: React.FC<Props> = ({ data, allData, year }) => {
  const [metric, setMetric] = React.useState<'income' | 'expense'>('income');

  const fmtCompact = (n: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(n);

  // 1. Ranking Chart (Horizontal Bar) - Top 10 Special Funds
  const barOption = useMemo(() => {
    // Sort by selected metric descending and take top 10
    const topFunds = [...data.special_fund.details]
      .sort((a, b) => metric === 'income' ? b.revenue - a.revenue : b.expenditure - a.expenditure)
      .slice(0, 10)
      .reverse(); // Reverse for display order

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}: <br/>${fmtCompact(p.value)} (NT$)`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'NT$',
        splitLine: { lineStyle: { type: 'dashed' } },
        axisLabel: { formatter: fmtCompact }
      },
      yAxis: {
        type: 'category',
        data: topFunds.map(f => f.name),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          formatter: (value: string) => {
            return value.length > 8 ? value.substring(0, 8) + '...' : value;
          }
        }
      },
      series: [
        {
          name: metric === 'income' ? 'Income' : 'Expense',
          type: 'bar',
          data: topFunds.map(f => (metric === 'income' ? f.revenue : f.expenditure) * 1000),
          itemStyle: { color: metric === 'income' ? '#8b5cf6' : '#f59e0b' },
          barGap: 0,
          label: { show: true, position: 'right', formatter: (p: any) => fmtCompact(p.value) }
        }
      ]
    };
  }, [data, metric]);

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
      tooltip: {
        trigger: 'axis', formatter: (params: any) => {
          let html = `<div class="font-bold mb-1">${params[0].axisValue}</div>`;
          params.forEach((p: any) => {
            html += `<div>${p.marker} ${p.seriesName}: ${fmtCompact(p.value)}</div>`;
          });
          return html;
        }
      },
      legend: { top: 0, data: ['Total Revenue', 'Total Expenditure'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.map(d => d.year)
      },
      yAxis: { type: 'value', name: 'NT$', axisLabel: { formatter: fmtCompact } },
      series: [
        {
          name: 'Total Revenue',
          type: 'line',
          smooth: true,
          data: chartData.map(d => d.revenue * 1000),
          itemStyle: { color: '#3b82f6' },
          areaStyle: { opacity: 0.1 },
          markLine: {
            symbol: 'none',
            label: { show: false },
            lineStyle: { color: '#64748b', type: 'dashed', width: 2 },
            data: [{ xAxis: String(year) }],
            animation: false
          }
        },
        {
          name: 'Total Expenditure',
          type: 'line',
          smooth: true,
          data: chartData.map(d => d.expenditure * 1000),
          itemStyle: { color: '#f97316' },
          areaStyle: { opacity: 0.1 }
        }
      ]
    };
  }, [allData, year]);

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-600">Top 10 Special Funds ({data.year})</h3>
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button
                onClick={() => setMetric('income')}
                className={`px-3 py-0.5 text-xs font-medium rounded transition-all ${metric === 'income' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500'}`}
              >
                Income
              </button>
              <button
                onClick={() => setMetric('expense')}
                className={`px-3 py-0.5 text-xs font-medium rounded transition-all ${metric === 'expense' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}
              >
                Expense
              </button>
            </div>
          </div>
          <ReactECharts option={barOption} style={{ height: '300px', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};

export default FundsPanel;
