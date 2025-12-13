import { useEffect, useState } from 'react';
import { loadAllData } from './utils/dataLoader';
import type { AppData } from './types/budget';

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData()
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-blue-900 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Taiwan Fiscal Trend Analysis Platform</h1>
          <p className="text-sm text-blue-200">2008-2025 Budget Data Visualization</p>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-xl animate-pulse">Loading Budget Data...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard title="Budget Rows" count={data?.budgets.length} color="bg-blue-100 border-blue-300 text-blue-900" />
            <StatsCard title="Funds Rows" count={data?.funds.length} color="bg-green-100 border-green-300 text-green-900" />
            <StatsCard title="Summary Rows" count={data?.summaries.length} color="bg-purple-100 border-purple-300 text-purple-900" />
          </div>
        )}
      </main>

      <footer className="bg-slate-800 text-slate-400 p-4 text-center text-sm">
        <p>Data Source: DGBAS | Built with React + D3</p>
      </footer>
    </div>
  );
}

function StatsCard({ title, count, color }: { title: string; count?: number; color: string }) {
  return (
    <div className={`p-6 rounded-lg border ${color} shadow-sm`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold">{count?.toLocaleString()}</p>
    </div>
  );
}

export default App;
