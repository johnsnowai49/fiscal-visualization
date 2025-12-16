import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CategoryItem } from '../types';

interface Props {
    data: CategoryItem[];
    total: number;
    year: number;
}

const EarnersPanel: React.FC<Props> = ({ data, total, year }) => {
    const sources = data.map((item: CategoryItem) => ({
        name: item.name,
        fullName: item.name,
        value: item.amount
    }));

    // Sort for Ranking Bar Chart
    const rankedSources = [...sources].sort((a, b) => a.value - b.value);

    // Donut Data: Top 5 + Others
    const donutData = useMemo(() => {
        const sorted = [...sources].sort((a, b) => b.value - a.value);
        if (sorted.length <= 5) return sorted;
        const top5 = sorted.slice(0, 5);
        const others = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);
        return [...top5, { name: 'Others', fullName: 'Others', value: others }];
    }, [sources]);

    const donutOption = useMemo(() => ({
        color: ['#0ea5e9', '#8b5cf6', '#f43f5e', '#64748b', '#f59e0b', '#cbd5e1'],
        tooltip: { trigger: 'item', formatter: '{b}: <br/>NT${c}B ({d}%)' },
        legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } },
        series: [
            {
                name: 'Revenue',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
                label: { show: false },
                labelLine: { show: false },
                data: donutData.map(s => ({ value: s.value, name: s.name }))
            }
        ]
    }), [donutData]);

    const barOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { top: '5%', left: '3%', right: '20%', bottom: '5%', containLabel: true },
        xAxis: { type: 'value', splitLine: { show: false } },
        yAxis: {
            type: 'category',
            data: rankedSources.map(s => s.name),
            axisLine: { show: false },
            axisTick: { show: false }
        },
        series: [
            {
                type: 'bar',
                data: rankedSources.map(s => s.value),
                itemStyle: { color: '#0ea5e9', borderRadius: [0, 4, 4, 0] },
                barWidth: '50%',
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
    }), [rankedSources, total]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-800">3. Earners</h2>
                <p className="text-sm text-slate-500">Revenue Sources Breakdown (Year {year})</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Composition */}
                <div className="h-64">
                    <h3 className="text-xs font-semibold text-center text-slate-400 uppercase tracking-wider mb-2">Composition</h3>
                    <ReactECharts option={donutOption} style={{ height: '100%', width: '100%' }} />
                </div>

                {/* Ranking */}
                <div className="h-64">
                    <h3 className="text-xs font-semibold text-center text-slate-400 uppercase tracking-wider mb-2">Top Earners Ranking</h3>
                    <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>
        </div>
    );
};

export default EarnersPanel;
