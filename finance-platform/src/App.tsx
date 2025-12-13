import { useEffect, useState } from 'react';
import { loadAllData } from './utils/dataLoader';
import { OverviewLineChart } from './components/charts/OverviewLineChart';
import { BreakdownSection } from './components/charts/BreakdownCharts';
import type { AppData } from './types/budget';
import { UnitProvider } from './context/UnitContext';
import { UnitControl } from './components/ui/UnitControl';

function Dashboard() {
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wider">TW FINANCE</h1>
          <p className="text-xs text-slate-400 mt-1">Fiscal Trend Platform</p>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <a href="#" className="block px-4 py-2 rounded bg-blue-600 text-white font-medium">Overview</a>
          <a href="#" className="block px-4 py-2 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">Details (Coming Soon)</a>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          v1.0.0 | Data: DGBAS
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 p-4 flex justify-between items-center z-10">
          <h2 className="text-lg font-semibold text-slate-700">Dashboard Overview</h2>
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button could go here */}
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading Fiscal Data...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8 pb-10">

              {/* Controls & Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <UnitControl />
                </div>
                <div className="lg:col-span-2 grid grid-cols-3 gap-4">
                  <StatsCard label="Total Years" value="16" sub="2008 - 2025" />
                  <StatsCard label="Data Rows" value={data?.budgets.length.toLocaleString() || '0'} sub="Unified Dataset" />
                  <StatsCard label="Funds" value={data?.funds.length.toLocaleString() || '0'} sub="Special Accounts" />
                </div>
              </div>

              {/* Main Chart */}
              <section>
                {/* Note: We pass full budget data now for aggregation */}
                {data?.budgets && <OverviewLineChart data={data.budgets} />}
              </section>

              {/* Breakdown Charts */}
              <section>
                <div className="border-t border-slate-200 pt-8">
                  <BreakdownSection
                    data={data?.budgets || []}
                    defaultYear={2025}
                  />
                </div>
              </section>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatsCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center">
      <span className="text-xs font-bold text-slate-400 uppercase">{label}</span>
      <span className="text-2xl font-bold text-slate-800 mt-1">{value}</span>
      <span className="text-xs text-slate-500 mt-1">{sub}</span>
    </div>
  );
}

export default function App() {
  return (
    <UnitProvider>
      <Dashboard />
    </UnitProvider>
  );
}
