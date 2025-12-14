import React, { useState, useEffect, useMemo, Suspense } from 'react';
import ReactECharts from 'echarts-for-react';
import { BudgetDetailData, BudgetDetailNode } from '../types';

// Lazy load data
const loadData = () => import('../src/data/billion/budget_detail.json').then(m => m.default as BudgetDetailData[]);

interface Props {
    year: number;
    onBack: () => void;
}

const BudgetDetailDashboard: React.FC<Props> = ({ year, onBack }) => {
    const [data, setData] = useState<BudgetDetailData[]>([]);
    const [loading, setLoading] = useState(true);
    // Removed internal year state
    const [path, setPath] = useState<string[]>([]); // Breadcrumb path (names)
    const [type, setType] = useState<'revenue' | 'expenditure'>('expenditure'); // Default to expenditure

    useEffect(() => {
        loadData().then(d => {
            setData(d);
            setLoading(false);
        });
    }, []);

    // --- Helpers to navigate the tree ---

    // Find node by path in a specific year
    const getNode = (yearData: BudgetDetailNode[], targetPath: string[]): BudgetDetailNode | null => {
        if (targetPath.length === 0) return { name: 'Total', value: 0, children: yearData }; // Virtual Root

        let current: BudgetDetailNode | undefined = yearData.find(n => n.name === targetPath[0]);
        for (let i = 1; i < targetPath.length; i++) {
            if (!current?.children) return null;
            current = current.children.find(n => n.name === targetPath[i]);
        }
        return current || null;
    };

    // --- Derived Data for Charts ---

    // 1. Current View Data (Donut + Bar)
    const currentViewNode = useMemo(() => {
        if (!data.length) return null;
        const yearData = data.find(d => d.year === year);
        if (!yearData) return null;

        // Select correct tree based on type
        const rootNodes = type === 'revenue' ? yearData.revenue : yearData.expenditure;
        return getNode(rootNodes, path);
    }, [data, year, path, type]);

    // 2. History Trend (Line Chart)
    const historyData = useMemo(() => {
        if (!data.length) return [];
        const trend = data.map(d => {
            const rootNodes = type === 'revenue' ? d.revenue : d.expenditure;
            const node = getNode(rootNodes, path);

            // If Root, sum all children
            const val = path.length === 0
                ? rootNodes.reduce((acc, c) => acc + c.value, 0)
                : (node ? node.value : 0);
            return { year: d.year, value: val };
        });
        return trend.sort((a, b) => a.year - b.year);
    }, [data, path, type]);

    // --- Chart Options ---

    const lineOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: historyData.map(d => d.year) },
        yAxis: { type: 'value', name: 'NT$ (Billions)' },
        series: [{
            data: historyData.map(d => d.value),
            type: 'line',
            smooth: true,
            color: '#3b82f6',
            areaStyle: { opacity: 0.1 }
        }]
    }), [historyData]);

    const childrenNodes = currentViewNode?.children || [];
    const sortedChildren = [...childrenNodes].sort((a, b) => b.value - a.value);

    const donutOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            data: sortedChildren.map(c => ({ value: c.value, name: c.name }))
        }]
    }), [sortedChildren]);

    const barOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: sortedChildren.slice(0, 10).map(c => c.name).reverse() },
        series: [{
            type: 'bar',
            data: sortedChildren.slice(0, 10).map(c => c.value).reverse(),
            itemStyle: { color: '#8b5cf6' }
        }]
    }), [sortedChildren]);

    // --- Interactions ---

    const handleDrillDown = (name: string) => {
        setPath([...path, name]);
    };

    const handleBreadcrumb = (index: number) => {
        setPath(path.slice(0, index + 1));
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading detailed budget data...</div>;

    return (
        <div className="space-y-6">
            {/* Header / Nav */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">← Back</button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div className="flex items-center text-sm">
                        <button
                            className={`hover:underline ${path.length === 0 ? 'font-bold text-blue-600' : 'text-slate-500'}`}
                            onClick={() => setPath([])}
                        >
                            Total
                        </button>
                        {path.map((p, i) => (
                            <React.Fragment key={i}>
                                <span className="mx-2 text-slate-400">/</span>
                                <button
                                    className={`hover:underline ${i === path.length - 1 ? 'font-bold text-blue-600' : 'text-slate-500'}`}
                                    onClick={() => handleBreadcrumb(i)}
                                >
                                    {p}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Type & Year Selector */}
                <div className="lg:col-span-3 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    {/* Type Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => { setType('revenue'); setPath([]); }}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${type === 'revenue' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Revenue
                        </button>
                        <button
                            onClick={() => { setType('expenditure'); setPath([]); }}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${type === 'expenditure' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Expenditure
                        </button>
                    </div>

                    {/* Year Display (Read Only) */}
                    <div className="text-lg font-semibold text-slate-700">Year: {year}</div>
                </div>

                {/* History - Full Width */}
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4">Historical Trend: {path[path.length - 1] || `Total ${type === 'revenue' ? 'Revenue' : 'Expenditure'}`}</h3>
                    <ReactECharts option={lineOption} style={{ height: '300px' }} />
                </div>

                {/* Breakdown - Donut */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4">Composition ({year})</h3>
                    {sortedChildren.length > 0 ? (
                        <ReactECharts
                            option={donutOption}
                            style={{ height: '300px' }}
                            onEvents={{
                                click: (params: any) => handleDrillDown(params.name)
                            }}
                        />
                    ) : (
                        <div className="text-center text-slate-400 py-20">No breakdown available (Leaf Node)</div>
                    )}
                </div>

                {/* Ranking - Bar */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4">Top Items ({year})</h3>
                    {sortedChildren.length > 0 ? (
                        <ReactECharts
                            option={barOption}
                            style={{ height: '300px' }}
                            onEvents={{
                                click: (params: any) => handleDrillDown(params.name)
                            }}
                        />
                    ) : (
                        <div className="text-center text-slate-400 py-20">No items available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BudgetDetailDashboard;
