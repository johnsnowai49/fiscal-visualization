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
    // State to hold V3 Data
    const [revData, setRevData] = useState<RelationalBudgetYear[]>([]);
    const [expData, setExpData] = useState<RelationalBudgetYear[]>([]);
    const [loading, setLoading] = useState(true);

    // Navigation State
    const [path, setPath] = useState<string[]>([]);
    const [type, setType] = useState<'revenue' | 'expenditure'>('expenditure');

    // UI State
    const [showAll, setShowAll] = useState(false);

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
                        rootChildren.push(node);
                    }
                } else {
                    rootChildren.push(node);
                }
            });
        };

        if (yearData.Kuan) processLevel(yearData.Kuan);
        if (yearData.Xiang) processLevel(yearData.Xiang);
        if (yearData.Mu) processLevel(yearData.Mu);
        if (yearData.Jie) processLevel(yearData.Jie);

        return rootChildren;
    };

    // Construct Trees
    const activeData = type === 'revenue' ? revData : expData;
    const currentYearData = useMemo(() => activeData.find(d => d.year === year), [activeData, year]);
    const currentTree = useMemo(() => buildHierarchy(currentYearData), [currentYearData]);

    // --- Helpers ---
    const getNode = (rootNodes: BudgetDetailNode[], targetPath: string[]): BudgetDetailNode | null => {
        if (targetPath.length === 0) {
            return {
                name: '總計',
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

    const currentViewNode = useMemo(() => {
        return getNode(currentTree, path);
    }, [currentTree, path, currentYearData]);

    // History Trend
    const historyData = useMemo(() => {
        if (!activeData.length) return [];

        const trend = activeData.map(d => {
            let val = 0;
            if (path.length === 0) {
                val = d.amount;
            } else {
                let currentId: string | null = null;
                const kuan = d.Kuan?.find(i => i.name === path[0]);
                if (kuan) {
                    currentId = kuan.id;
                    if (path.length === 1) val = kuan.amount;
                } else currentId = null;

                if (path.length > 1 && currentId) {
                    const xiang = d.Xiang?.find(i => i.name === path[1] && i.parent_id === currentId);
                    if (xiang) {
                        currentId = xiang.id;
                        if (path.length === 2) val = xiang.amount;
                    } else currentId = null;
                }

                if (path.length > 2 && currentId) {
                    const mu = d.Mu?.find(i => i.name === path[2] && i.parent_id === currentId);
                    if (mu) {
                        currentId = mu.id;
                        if (path.length === 3) val = mu.amount;
                    } else currentId = null;
                }

                if (path.length > 3 && currentId) {
                    const jie = d.Jie?.find(i => i.name === path[3] && i.parent_id === currentId);
                    if (jie) {
                        if (path.length === 4) val = jie.amount;
                    }
                }
            }
            return { year: d.year, value: val };
        });

        return trend.sort((a, b) => a.year - b.year);
    }, [activeData, path]);

    // Formatting
    // Formatting
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(n * 1000);
    const fmtCompact = (n: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(n * 1000);

    // Filter & Sort Children
    const childrenNodes = currentViewNode?.children || [];
    const sortedChildren = [...childrenNodes]
        .filter(c => c.value > 0)
        .sort((a, b) => b.value - a.value);

    // --- Chart Options ---

    const lineOption = useMemo(() => ({
        tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0].axisValue}<br/>${fmt(params[0].value)}` },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: historyData.map(d => `Y${d.year}`) },
        yAxis: { type: 'value', name: 'NT$', axisLabel: { formatter: fmtCompact }, splitLine: { lineStyle: { type: 'dashed' } } },
        series: [{
            data: historyData.map(d => d.value),
            type: 'line',
            smooth: true,
            color: type === 'revenue' ? '#3b82f6' : '#ef4444',
            areaStyle: { opacity: 0.1 },
            markLine: {
                symbol: 'none',
                label: { show: false },
                lineStyle: { color: '#64748b', type: 'dashed', width: 2 },
                data: [{ xAxis: `Y${year}` }],
                animation: false
            }
        }]
    }), [historyData, type, year]);

    const donutOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${fmt(p.value)} (${p.percent}%)` },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            data: sortedChildren.map(c => ({ value: c.value, name: c.name })),
            label: {
                show: true,
                formatter: (p: any) => `${p.name}\n${p.percent}%`
            }
        }]
    }), [sortedChildren]);

    const displayBarData = showAll ? sortedChildren : sortedChildren.slice(0, 5);
    const reversedBarData = [...displayBarData].reverse();

    const barOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}: ${fmt(p[0].value)}` },
        grid: { left: '3%', right: '10%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: { type: 'value', axisLabel: { formatter: fmtCompact } },
        yAxis: { type: 'category', data: reversedBarData.map(c => c.name) },
        series: [{
            type: 'bar',
            data: reversedBarData.map(c => c.value),
            itemStyle: { color: type === 'revenue' ? '#3b82f6' : '#ef4444' },
            label: {
                show: true,
                position: 'right',
                formatter: (p: any) => fmtCompact(p.value as number)
            }
        }]
    }), [reversedBarData, type]);

    // --- Interactions ---

    const handleDrillDown = (name: string) => {
        setPath([...path, name]);
        setShowAll(false);
    };

    const handleBreadcrumb = (index: number) => {
        setPath(path.slice(0, index + 1));
        setShowAll(false);
    };

    if (loading) return <div className="p-12 text-center text-slate-500">正在載入詳細預算資料...</div>;

    return (
        <div className="space-y-6">
            {/* Merged Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                {/* Row 1: Nav & Total */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        {/* <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">← Back</button> */}
                        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                        <div className="flex flex-wrap items-center text-sm gap-y-2">
                            <button
                                className={`hover:underline ${path.length === 0 ? 'font-bold text-blue-600' : 'text-slate-500'}`}
                                onClick={() => { setPath([]); setShowAll(false); }}
                            >
                                總計
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

                    <div className="flex items-center justify-between md:justify-end gap-6">
                        <div className="text-right">
                            <div className="text-xl font-bold text-slate-800 font-mono">
                                {fmt(currentViewNode?.value || 0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => { setType('revenue'); setPath([]); setShowAll(false); }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'revenue' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            收入
                        </button>
                        <button
                            onClick={() => { setType('expenditure'); setPath([]); setShowAll(false); }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'expenditure' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            支出
                        </button>
                    </div>
                    <div className="text-sm font-semibold text-slate-400">{year} 年度</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


                {/* History - Full Width */}
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4">歷年數據: {path[path.length - 1] || `總${type === 'revenue' ? '收入' : '支出'}`}</h3>
                    <div className="h-[300px]">
                        <ReactECharts option={lineOption} style={{ height: '100%', width: '100%' }} />
                    </div>
                </div>

                {/* Breakdown - Donut */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4">組成結構 ({year})</h3>
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
                            <div className="flex items-center justify-center h-full text-slate-400">無細項資料</div>
                        )}
                    </div>
                </div>

                {/* Ranking - Bar */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700">前幾大項目 ({year})</h3>
                        {sortedChildren.length > 5 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                                {showAll ? '顯示較少' : '顯示更多'}
                            </button>
                        )}
                    </div>
                    <div style={{ height: showAll ? `${Math.max(300, sortedChildren.length * 30)}px` : '300px' }} className="transition-all duration-300">
                        {sortedChildren.length > 0 ? (
                            <ReactECharts
                                option={barOption}
                                style={{ height: '100%', width: '100%' }}
                                onEvents={{
                                    click: (params: any) => handleDrillDown(params.name)
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">無資料</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetDetailDashboard;
