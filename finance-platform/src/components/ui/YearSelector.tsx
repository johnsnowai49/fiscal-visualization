interface Props {
    years: number[];
    selectedYear: number;
    onChange: (year: number) => void;
}

export function YearSelector({ years, selectedYear, onChange }: Props) {
    return (
        <div className="flex items-center space-x-2">
            <label htmlFor="year-select" className="font-semibold text-slate-700">Fiscal Year:</label>
            <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => onChange(Number(e.target.value))}
                className="border border-slate-300 rounded px-3 py-1 bg-white text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
                {years.map((y) => (
                    <option key={y} value={y}>
                        {y} (ROC {y - 1911})
                    </option>
                ))}
            </select>
        </div>
    );
}
