import { useUnit, type Currency, type Magnitude } from '../../context/UnitContext';

export function UnitControl() {
    const { currency, setCurrency, magnitude, setMagnitude } = useUnit();

    return (
        <div className="flex flex-col space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Currency</label>
                <div className="flex rounded-md shadow-sm" role="group">
                    {(['TWD', 'USD'] as Currency[]).map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCurrency(c)}
                            className={`px-4 py-2 text-sm font-medium border first:rounded-l-lg last:rounded-r-lg ${currency === c
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Unit Scale</label>
                <div className="flex rounded-md shadow-sm" role="group">
                    {(['raw', 'million', 'billion'] as Magnitude[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMagnitude(m)}
                            className={`px-3 py-2 text-sm font-medium border first:rounded-l-lg last:rounded-r-lg capitalize ${magnitude === m
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
