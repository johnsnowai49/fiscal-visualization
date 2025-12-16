import React, { useState, useMemo } from 'react';
import DashboardHeader from './components/DashboardHeader';
import OverviewChart from './components/OverviewChart';
import SpendersPanel from './components/SpendersPanel';
import EarnersPanel from './components/EarnersPanel';
import FundsPanel from './components/FundsPanel';
import { OVERVIEW_DATA, FUNDS_DATA } from './data';
import BudgetDetailDashboard from './components/BudgetDetailDashboard'; // Lazy loaded internally

const App: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [view, setView] = useState<'overview' | 'detail'>('overview');

  const currentOverview = useMemo(() => {
    return OVERVIEW_DATA.find(d => d.year === selectedYear) || OVERVIEW_DATA[OVERVIEW_DATA.length - 1];
  }, [selectedYear]);

  const currentFunds = useMemo(() => {
    return FUNDS_DATA.find(d => d.year === selectedYear);
  }, [selectedYear]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader />

        {/* Global Controls */}
        <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur py-4 mb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className={`flex items-center gap-4 ${view === 'detail' ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                onClick={() => setView('detail')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Explorer &rarr;
              </button>
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
              <span className="text-xs font-bold text-slate-400 px-2">{OVERVIEW_DATA[0].year}</span>
              <input
                type="range"
                min={OVERVIEW_DATA[0].year}
                max={OVERVIEW_DATA[OVERVIEW_DATA.length - 1].year}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-32 md:w-64 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-bold text-slate-400 px-2">{OVERVIEW_DATA[OVERVIEW_DATA.length - 1].year}</span>
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded">
                Year {selectedYear}
              </span>
            </div>
          </div>
        </div>

      </div>

      {view === 'overview' ? (
        <div className="flex flex-col gap-6">
          <section>
            <OverviewChart />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendersPanel data={currentOverview.expenditure} year={selectedYear} />
            <EarnersPanel data={currentOverview.revenue} year={selectedYear} />
          </section>

          <section>
            {currentFunds && <FundsPanel data={currentFunds} />}
          </section>
        </div>
      ) : (
        <BudgetDetailDashboard year={selectedYear} onBack={() => setView('overview')} />
      )}

      <footer className="mt-12 text-center text-slate-400 text-sm py-4 border-t border-slate-200">
        <p>© 2025 FiscalInsight Taiwan (Real Data Edition)</p>
      </footer>
    </div>
  );
};

export default App;
