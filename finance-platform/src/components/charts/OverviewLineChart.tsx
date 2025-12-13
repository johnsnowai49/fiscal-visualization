import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { BudgetRow } from '../../types/budget';
import { useUnit } from '../../context/UnitContext';

interface Props {
    data: BudgetRow[];
}

interface AggregatedPoint {
    year: number;
    type: 'Revenue' | 'Expenditure';
    amount: number;
}

export function OverviewLineChart({ data }: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
    const { getValue, formatMoney, getLabel } = useUnit();

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: 400,
                });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Aggregate Data: Sum by Year + Type
    const aggregatedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const map = new Map<string, number>();

        data.forEach(d => {
            const key = `${d.year}-${d.type}`;
            const current = map.get(key) || 0;
            map.set(key, current + d.amount);
        });

        const result: AggregatedPoint[] = [];
        map.forEach((amount, key) => {
            const [yearStr, type] = key.split('-');
            result.push({
                year: parseInt(yearStr),
                type: type as 'Revenue' | 'Expenditure',
                amount: amount
            });
        });

        return result.sort((a, b) => a.year - b.year);
    }, [data]);

    // Draw Chart
    useEffect(() => {
        if (!aggregatedData.length || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const { width, height } = dimensions;
        const margin = { top: 20, right: 30, bottom: 40, left: 80 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // X Axis
        const x = d3.scaleLinear()
            .domain(d3.extent(aggregatedData, d => d.year) as [number, number])
            .range([0, innerWidth]);

        // Y Axis (Converted Value)
        const yMax = d3.max(aggregatedData, d => getValue(d.amount)) || 0;
        const y = d3.scaleLinear()
            .domain([0, yMax * 1.1])
            .range([innerHeight, 0]);

        // Axes
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(10));

        g.append('g')
            .call(d3.axisLeft(y).ticks(5).tickFormat((d) => d.toLocaleString()));

        // Grid lines
        g.append('g')
            .attr('class', 'grid')
            .attr('stroke-opacity', 0.1)
            .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(() => ''));

        // Line Generator
        const line = d3.line<AggregatedPoint>()
            .x(d => x(d.year))
            .y(d => y(getValue(d.amount)))
            .curve(d3.curveMonotoneX);

        const color = d3.scaleOrdinal()
            .domain(['Revenue', 'Expenditure'])
            .range(['#10b981', '#ef4444']);

        const types = ['Revenue', 'Expenditure'] as const;

        types.forEach(type => {
            const typeData = aggregatedData.filter(d => d.type === type);

            // Line
            g.append('path')
                .datum(typeData)
                .attr('fill', 'none')
                .attr('stroke', color(type) as string)
                .attr('stroke-width', 3)
                .attr('d', line)
                .transition().duration(1000)
                .attrTween('stroke-dasharray', function () {
                    const len = this.getTotalLength();
                    return d3.interpolateString(`0,${len}`, `${len},${len}`);
                });

            // Dots
            g.selectAll(`.dot-${type}`)
                .data(typeData)
                .enter().append('circle')
                .attr('cx', d => x(d.year))
                .attr('cy', d => y(getValue(d.amount)))
                .attr('r', 5)
                .attr('fill', 'white')
                .attr('stroke', color(type) as string)
                .attr('stroke-width', 2)
                .on('mouseover', function (_event, d) {
                    d3.select(this).attr('r', 8).attr('fill', color(type) as string);

                    g.append('text')
                        .attr('class', 'tooltip-text')
                        .attr('x', x(d.year))
                        .attr('y', y(getValue(d.amount)) - 15)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '12px')
                        .attr('font-weight', 'bold')
                        .attr('fill', '#334155')
                        .text(`${d.year}: ${formatMoney(d.amount)}`);
                })
                .on('mouseout', function () {
                    d3.select(this).attr('r', 5).attr('fill', 'white');
                    g.selectAll('.tooltip-text').remove();
                });
        });

        // Legend
        const legend = svg.append('g').attr('transform', `translate(${width - 200}, 0)`);
        types.forEach((t, i) => {
            const row = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
            row.append('line')
                .attr('x1', 0).attr('y1', 5)
                .attr('x2', 20).attr('y2', 5)
                .attr('stroke', color(t) as string)
                .attr('stroke-width', 3);
            row.append('text')
                .attr('x', 25).attr('y', 5)
                .attr('alignment-baseline', 'middle')
                .text(t === 'Revenue' ? 'Total (Revenue)' : 'Total (Expenditure)')
                .attr('font-size', '12px')
                .attr('fill', '#64748b');
        });

        // Y Axis Label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '12px')
            .text(getLabel());

    }, [aggregatedData, dimensions, getValue, formatMoney, getLabel]);

    return (
        <div ref={containerRef} className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h3 className="text-xl font-bold mb-6 text-slate-800 tracking-tight">Financial Overview</h3>
            <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
        </div>
    );
}
