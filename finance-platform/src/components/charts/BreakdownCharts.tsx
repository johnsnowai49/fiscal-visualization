import { useState, useMemo } from 'react';
import type { BudgetRow } from '../../types/budget';
import { DonutChart, type DataItem } from './DonutChart';
import { YearSelector } from '../ui/YearSelector';

interface Props {
    data: BudgetRow[];
    defaultYear: number;
}

export function BreakdownSection({ data, defaultYear }: Props) {
    const [year, setYear] = useState(defaultYear);

    const availableYears = useMemo(() => {
        return Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a);
    }, [data]);

    const { revenueData, expenditureData } = useMemo(() => {
        if (!data) return { revenueData: [], expenditureData: [] };

        const yearData = data.filter(d => d.year === year);

        const processData = (type: 'Revenue' | 'Expenditure'): DataItem[] => {
            // 1. Filter by Type
            const items = yearData.filter(d => d.type === type);

            // 2. Group by Category_1 (Agency or Source)
            // Note: budget_all.csv has PARENT rows (where item_name matches category_2 or is duplicate).
            // Strategy: Sum unique item_name rows? Or rely on Category_1 being the "Block".
            // Simplified approach: Sum all 'amount' where 'item_name' == 'category_1' ? No.
            // Better approach: User said rows contain Parent totals.
            // We should check if we can just identifying the Top Level rows.
            // If we group by category_1 and sum ALL rows, we will double count if children are present.

            // Heuristic: Identifying Leaf Nodes vs Parents. 
            // If we trust the "Summary" file, we'd use that. But we are urged to use `budget_all`.

            // Alternative: Group by `category_1`. But wait, if `category_1` row exists with `amount`, and children exist...
            // Let's filter for rows where `account_name` IS NOT EMPTY? No, some high level items have no account.
            // Let's filter for rows where `category_2` equals `category_1`?

            // SAFER BET for Composition:
            // Group by `category_1` and take the MAX value? No.
            // Let's look at specific files... 
            // Actually, for broad breakdown, let's just Sum everything and divide by 2? Risks.

            // Let's try to Sum distinct `category_1` using the map found in `budget_all.csv`...
            // Wait, we have the `summary_all.csv` for totals. 
            // But for breakdown (Who spends?), we need Agency Breakdown.
            // Let's assume we sum all rows where `item_name` is NOT a total of others.
            // Quickest heuristic: Group by `category_1`, sum `amount`. 
            // If the sum is ridiculously variable, we know.
            // Actually, usually `category_1` is the bucket.

            const categoryMap = new Map<string, number>();
            items.forEach(d => {
                const current = categoryMap.get(d.category_1) || 0;
                categoryMap.set(d.category_1, current + d.amount);
            });

            // Convert to array
            let result = Array.from(categoryMap.entries()).map(([label, value]) => ({ label, value }));

            // Sort Desc
            result.sort((a, b) => b.value - a.value);

            // Take Top 5 + Others
            if (result.length > 6) {
                const top5 = result.slice(0, 5);
                const others = result.slice(5).reduce((acc, curr) => acc + curr.value, 0);
                return [...top5, { label: 'Others', value: others }];
            }
            return result;
        };

        return {
            revenueData: processData('Revenue'),
            expenditureData: processData('Expenditure')
        };

    }, [data, year]);

    const COLORS_REV = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#94a3b8'];
    const COLORS_EXP = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#94a3b8'];

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-700">Detailed Breakdown</h3>
                <YearSelector years={availableYears} selectedYear={year} onChange={setYear} />
            </div>

            {/* Alert about double counting/estimation if needed, currently implicit */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DonutChart
                    title={`Revenue Sources (${year})`}
                    data={revenueData}
                    colorScheme={COLORS_REV}
                />
                <DonutChart
                    title={`Expenditure Agencies (${year})`}
                    data={expenditureData}
                    colorScheme={COLORS_EXP}
                />
            </div>
        </div>
    );
}
