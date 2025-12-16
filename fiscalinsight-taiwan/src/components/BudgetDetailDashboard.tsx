import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { BudgetDetailNode, RelationalBudgetYear, RelationalBudgetItem } from '../types';

// Lazy load V3 data
const loadRevenueData = () => import('../data/json/revenue_by_source.json').then(m => m.default as RelationalBudgetYear[]);
const loadExpenditureData = () => import('../data/json/expenditure_by_function.json').then(m => m.default as RelationalBudgetYear[]);

interface Props {
    year: number;
    onBack: () => void;
}

const BudgetDetailDashboard: React.FC<Props> = ({ year, onBack }) => {
    // State to hold V3 Data (Array of Year Objects)
    const [revData, setRevData] = useState<RelationalBudgetYear[]>([]);
    const [expData, setExpData] = useState<RelationalBudgetYear[]>([]);
    const [loading, setLoading] = useState(true);

    // Breadcrumb path stores NAMES of the items in the drilled down path
    const [path, setPath] = useState<string[]>([]);
    const [type, setType] = useState<'revenue' | 'expenditure'>('expenditure');

    useEffect(() => {
        Promise.all([loadRevenueData(), loadExpenditureData()]).then(([r, e]) => {
            setRevData(r);
            setExpData(e);
            setLoading(false);
        });
    }, []);

    // --- Tree Construction Logic (V3) ---
    const buildHierarchy = (yearData: RelationalBudgetYear | undefined): BudgetDetailNode[] => {
        if (!yearData) return [];

        const nodeMap = new Map<string, BudgetDetailNode>();
        const rootChildren: BudgetDetailNode[] = [];

        // Helper to process a level
        const processLevel = (items: RelationalBudgetItem[]) => {
            items.forEach(item => {
                const node: BudgetDetailNode = {
                    name: item.name,
                    value: item.amount,
                    children: []
                };
                nodeMap.set(item.id, node);

                if (item.parent_id) {
                    const parent = nodeMap.get(item.parent_id);
                    if (parent) {
                        if (!parent.children) parent.children = [];
                        parent.children.push(node);
                    } else {
                        // Orphan or Root? Treat as root if parent missing (shouldn't happen in valid data)
                        rootChildren.push(node);
                    }
                } else {
                    // No parent (Kuan), add to root
                    rootChildren.push(node);
                }
            });
        };

        // Process in order: Kuan -> Xiang -> Mu -> Jie
        if (yearData.Kuan) processLevel(yearData.Kuan);
        if (yearData.Xiang) processLevel(yearData.Xiang);
        if (yearData.Mu) processLevel(yearData.Mu);
        if (yearData.Jie) processLevel(yearData.Jie);

        return rootChildren;
    };

    // Construct Trees Memoized for current year
    const activeData = type === 'revenue' ? revData : expData;
    const currentYearData = useMemo(() => activeData.find(d => d.year === year), [activeData, year]);

    // Build tree only when data/year changes
    const currentTree = useMemo(() => buildHierarchy(currentYearData), [currentYearData]);

    // --- Helpers to navigate the tree ---
    const getNode = (rootNodes: BudgetDetailNode[], targetPath: string[]): BudgetDetailNode | null => {
        // Virtual Root matching current year Total
        if (targetPath.length === 0) {
            return {
                name: 'Total',
                value: currentYearData?.amount || 0,
                children: rootNodes
            };
        }

        let current: BudgetDetailNode | undefined = rootNodes.find(n => n.name === targetPath[0]);
        for (let i = 1; i < targetPath.length; i++) {
            if (!current?.children) return null;
            current = current.children.find(n => n.name === targetPath[i]);
        }
        return current || null;
    };

    // --- Derived Data for Charts ---

    // 1. Current View Node (Source for Donut + Bar)
    const currentViewNode = useMemo(() => {
        return getNode(currentTree, path);
    }, [currentTree, path, currentYearData]);

    // 2. History Trend (Line Chart) 
    const historyData = useMemo(() => {
        if (!activeData.length) return [];

        // Calculate trend across ALL years for the currently selected path
        const trend = activeData.map(d => {
            let val = 0;
            if (path.length === 0) {
                // Total Amount for the year
                val = d.amount;
            } else {
                // Navigate path in this year's data lists
                // Path [A, B, C] -> Find A in Kuan, B in Xiang (child of A), C in Mu (child of B)
                let currentId: string | null = null;

                // Level 0: Kuan
                const kuan = d.Kuan?.find(i => i.name === path[0]);
                if (kuan) {
                    currentId = kuan.id;
                    if (path.length === 1) val = kuan.amount;
                } else currentId = null;

                // Level 1: Xiang
                if (path.length > 1 && currentId) {
                    const xiang = d.Xiang?.find(i => i.name === path[1] && i.parent_id === currentId);
                    if (xiang) {
                        currentId = xiang.id;
                        if (path.length === 2) val = xiang.amount;
                    } else currentId = null;
                }

                // Level 2: Mu
                if (path.length > 2 && currentId) {
                    const mu = d.Mu?.find(i => i.name === path[2] && i.parent_id === currentId);
                    if (mu) {
                        currentId = mu.id;
                        if (path.length === 3) val = mu.amount;
                    } else currentId = null;
                }

                // Level 3: Jie
                if (path.length > 3 && currentId) {
                    const jie = d.Jie?.find(i => i.name === path[3] && i.parent_id === currentId);
                    if (jie) {
                        if (path.length === 4) val = jie.amount;
                    } else currentId = null;
                }
            }
            return { year: d.year, value: val };
        });

        return trend.sort((a, b) => a.year - b.year);
    }, [activeData, path]);


    // --- Formatting ---
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(n);
    const fmtCompact = (n: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(n);

    // --- Chart Options ---

    const lineOption = useMemo(() => ({
        tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0].axisValue}<br/>${fmt(params[0].value)}` },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: historyData.map(d => d.year) },
        yAxis: { type: 'value', name: 'NT$', axisLabel: { formatter: fmtCompact } },
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
        tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${fmt(p.value)} (${p.percent}%)` },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            data: sortedChildren.map(c => ({ value: c.value, name: c.name })),
            label: {
                show: true,
                formatter: (p: any) => `${p.name}\n${fmtCompact(p.value)}`
            }
        }]
    }), [sortedChildren]);

    const barOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}: ${fmt(p[0].value)}` },
        grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', axisLabel: { formatter: fmtCompact } },
        yAxis: { type: 'category', data: sortedChildren.slice(0, 10).map(c => c.name).reverse() },
        series: [{
            type: 'bar',
            data: sortedChildren.slice(0, 10).map(c => c.value).reverse(),
            itemStyle: { color: '#8b5cf6' },
            label: {
                show: true,
                position: 'right',
                formatter: (p: any) => fmtCompact(p.value as number)
            }
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
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">← Back</button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div className="flex flex-wrap items-center text-sm gap-y-2">
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
                <div className="text-right">
                    <div className="text-sm text-slate-500">Total {type === 'revenue' ? 'Revenue' : 'Expenditure'}</div>
                    <div className="text-xl font-bold text-slate-800 font-mono">
                        {fmt(currentViewNode?.value || 0)}
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
                    <div className="h-[300px]">
                        <ReactECharts option={lineOption} style={{ height: '100%', width: '100%' }} />
                    </div>
                </div>

                {/* Breakdown - Donut */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4">Composition ({year})</h3>
                    <div className="h-[300px]">
                        {sortedChildren.length > 0 ? (
                            <ReactECharts
                                option={donutOption}
                                style={{ height: '100%', width: '100%' }}
                                onEvents={{
                                    click: (params: any) => handleDrillDown(params.name)
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">No breakdown available (Leaf Node)</div>
                        )}
                    </div>
                </div>

                {/* Ranking - Bar */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4">Top Items ({year})</h3>
                    <div className="h-[300px]">
                        {sortedChildren.length > 0 ? (
                            <ReactECharts
                                option={barOption}
                                style={{ height: '100%', width: '100%' }}
                                onEvents={{
                                    click: (params: any) => handleDrillDown(params.name)
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">No items available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetDetailDashboard;
