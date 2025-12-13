import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { BudgetRow } from '../../types/budget';
import { useUnit } from '../../context/UnitContext';

interface Props {
    data: BudgetRow[];
}

interface TreeNode {
    name: string;
    value?: number;
    children?: TreeNode[];
}

// Extend D3's HierarchyNode to include the layout coordinates added by d3.treemap
interface TreemapNode extends d3.HierarchyRectangularNode<TreeNode> {
    // d3.HierarchyRectangularNode already includes x0, y0, x1, y1
}

export function Treemap({ data }: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const { formatMoney, getValue } = useUnit();
    const [selectedType, setSelectedType] = useState<'Revenue' | 'Expenditure'>('Expenditure');
    const [year, setYear] = useState<number>(2025);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: 600,
                });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const rootData = useMemo(() => {
        if (!data.length) return null;

        const filtered = data.filter(d => d.year === year && d.type === selectedType);

        const groupBy = (rows: BudgetRow[], keyFn: (r: BudgetRow) => string) => {
            const groups = new Map<string, BudgetRow[]>();
            rows.forEach(r => {
                const key = keyFn(r);
                if (key) {
                    const arr = groups.get(key) || [];
                    arr.push(r);
                    groups.set(key, arr);
                }
            });
            return groups;
        };

        const agencyGroups = groupBy(filtered, d => d.category_1);

        const children: TreeNode[] = [];

        agencyGroups.forEach((agencyRows, agencyName) => {
            const agencyNode: TreeNode = { name: agencyName, children: [] };
            const itemGroups = groupBy(agencyRows, d => d.item_name);

            if (itemGroups.size === 0) {
                const sumRow = agencyRows.find(r => !r.item_name);
                if (sumRow) agencyNode.value = sumRow.amount;
            } else {
                itemGroups.forEach((itemRows, itemName) => {
                    const accountRows = itemRows.filter(r => r.account_name);

                    if (accountRows.length > 0) {
                        const accountNodes = accountRows.map(r => ({
                            name: r.account_name,
                            value: r.amount
                        }));
                        agencyNode.children!.push({ name: itemName, children: accountNodes });
                    } else {
                        const leafRow = itemRows.find(r => !r.account_name);
                        if (leafRow) {
                            agencyNode.children!.push({ name: itemName, value: leafRow.amount });
                        }
                    }
                });
            }

            if (agencyNode.children?.length === 0 && !agencyNode.value) {
                // Skip empty agencies
            } else {
                children.push(agencyNode);
            }
        });

        return { name: "Root", children } as TreeNode;

    }, [data, year, selectedType]);

    useEffect(() => {
        if (!rootData || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const { width, height } = dimensions;

        // 1. Create Hierarchy
        const hierarchy = d3.hierarchy(rootData)
            .sum(d => getValue(d.value || 0))
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        // 2. Compute Layout
        const root = d3.treemap<TreeNode>()
            .size([width, height])
            .paddingTop(28)
            .paddingRight(7)
            .paddingInner(3)
            (hierarchy) as TreemapNode; // Cast here to tell TS it now has coords

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // 3. Draw Nodes (Leaves)
        const nodes = svg.selectAll('g')
            .data(root.leaves())
            .enter().append('g')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        nodes.append('rect')
            .attr('width', d => Math.max(0, d.x1 - d.x0))
            .attr('height', d => Math.max(0, d.y1 - d.y0))
            .attr('fill', d => {
                let parent = d.parent;
                while (parent && parent.depth > 1) parent = parent.parent;
                return color(parent?.data.name || 'Others');
            })
            .attr('rx', 4)
            .style('opacity', 0.8)
            .on('mouseover', function () { d3.select(this).style('opacity', 1).attr('stroke', '#fff').attr('stroke-width', 2); })
            .on('mouseout', function () { d3.select(this).style('opacity', 0.8).attr('stroke', 'none'); })
            .append('title')
            .text(d => {
                const path = d.ancestors().reverse().map(n => n.data.name).slice(1).join(' > ');
                return `${path}\n${formatMoney(d.data.value || 0)}`;
            });

        nodes.append('text')
            .attr('x', 4)
            .attr('y', 14)
            .text(d => d.data.name)
            .attr('font-size', '10px')
            .attr('fill', 'white')
            .style('pointer-events', 'none')
            .each(function (d) {
                if ((d.x1 - d.x0) < 30 || (d.y1 - d.y0) < 20) d3.select(this).remove();
            });

        // 4. Draw Headers (Depth 1)
        const categories = root.descendants().filter(d => d.depth === 1);

        svg.selectAll('.header')
            .data(categories)
            .enter().append('text')
            .attr('class', 'header')
            .attr('x', d => d.x0 + 4)
            .attr('y', d => d.y0 + 20)
            .text(d => d.data.name)
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', '#334155')
            .each(function (d) {
                if ((d.x1 - d.x0) < 50) d3.select(this).remove();
            });

    }, [rootData, dimensions, getValue, formatMoney]);

    if (!rootData) return <div>No Data</div>;

    return (
        <div ref={containerRef} className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Detail Map (Treemap)</h3>
                <div className="flex space-x-4">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-300 rounded px-3 py-1 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <div className="flex rounded-md shadow-sm">
                        <button
                            onClick={() => setSelectedType('Revenue')}
                            className={`px-3 py-1 text-sm font-medium border rounded-l ${selectedType === 'Revenue' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                        >
                            Revenue
                        </button>
                        <button
                            onClick={() => setSelectedType('Expenditure')}
                            className={`px-3 py-1 text-sm font-medium border rounded-r -ml-px ${selectedType === 'Expenditure' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                        >
                            Expenditure
                        </button>
                    </div>
                </div>
            </div>
            <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full bg-slate-50 rounded" />
        </div>
    );
}
