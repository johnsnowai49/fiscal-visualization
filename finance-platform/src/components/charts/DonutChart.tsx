import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface DataItem {
    label: string;
    value: number;
}

interface Props {
    data: DataItem[];
    title: string;
    colorScheme: readonly string[];
}

export function DonutChart({ data, title, colorScheme }: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(colorScheme);

        const pie = d3.pie<DataItem>()
            .value(d => d.value)
            .sort(null);

        const arc = d3.arc<d3.PieArcDatum<DataItem>>()
            .innerRadius(radius * 0.5)
            .outerRadius(radius * 0.8);

        const arcHover = d3.arc<d3.PieArcDatum<DataItem>>()
            .innerRadius(radius * 0.5)
            .outerRadius(radius * 0.9);

        // Filter non-positive values
        const pieData = pie(data.filter(d => d.value > 0));
        const total = d3.sum(data, d => d.value);

        g.selectAll('path')
            .data(pieData)
            .enter().append('path')
            .attr('fill', d => color(d.data.label) as string)
            .attr('d', arc)
            .attr('stroke', 'white')
            .attr('stroke-width', '2px')
            .style('cursor', 'pointer')
            .on('mouseover', function (_event, d) {
                d3.select(this).transition().duration(200).attr('d', arcHover as any);

                // Center Text update
                g.select('.center-text-label').text(d.data.label);
                g.select('.center-text-value').text(`${(d.data.value / 1e8).toFixed(1)}億`);
                g.select('.center-text-percent').text(`${((d.data.value / total) * 100).toFixed(1)}%`);
            })
            .on('mouseout', function (_event) {
                d3.select(this).transition().duration(200).attr('d', arc as any);
                // Reset Center
                g.select('.center-text-label').text('Total');
                g.select('.center-text-value').text(`${(total / 1e8).toFixed(0)}億`);
                g.select('.center-text-percent').text('');
            });

        // Center Text
        const textGroup = g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em');

        textGroup.append('tspan')
            .attr('class', 'center-text-label')
            .attr('x', 0)
            .attr('dy', '0')
            .attr('font-size', '14px')
            .attr('fill', '#64748b')
            .text('Total');

        textGroup.append('tspan')
            .attr('class', 'center-text-value')
            .attr('x', 0)
            .attr('dy', '1.4em')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', '#334155')
            .text(`${(total / 1e8).toFixed(0)}億`);

        textGroup.append('tspan')
            .attr('class', 'center-text-percent')
            .attr('x', 0)
            .attr('dy', '1.4em')
            .attr('font-size', '14px')
            .attr('fill', '#64748b')
            .text('');

        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('class', 'text-lg font-bold fill-slate-700')
            .text(title);

    }, [data, title, colorScheme, radius]);

    return (
        <div className="flex flex-col items-center">
            <svg ref={svgRef} width={width} height={height} className="max-w-full" />
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorScheme[i % colorScheme.length] }}></span>
                        <span className="text-slate-600 truncate max-w-[120px]" title={d.label}>{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
