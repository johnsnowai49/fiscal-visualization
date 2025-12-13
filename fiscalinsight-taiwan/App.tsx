import React, { useState, useMemo } from 'react';
import DashboardHeader from './components/DashboardHeader';
import OverviewChart from './components/OverviewChart';
import SpendersPanel from './components/SpendersPanel';
import EarnersPanel from './components/EarnersPanel';
import FundsPanel from './components/FundsPanel';
import { FISCAL_DATA } from './data';

const App: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(12);

  const currentData = useMemo(() => {
    return FISCAL_DATA.find(d => d.year === selectedYear) || FISCAL_DATA[FISCAL_DATA.length - 1];
  }, [selectedYear]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader />
        
        {/* Global Controls */}
        <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur py-4 mb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
               <h2 className="text-lg font-semibold text-slate-700">Fiscal Analysis Dashboard</h2>
               <p className="text-xs text-slate-400">Select a year to update Sections 2-4</p>
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                <span className="text-xs font-bold text-slate-400 px-2">Y1</span>
                <input
                    type="range"
                    min="1"
                    max="12"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-32 md:w-64 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-xs font-bold text-slate-400 px-2">Y12</span>
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded">
                    Year {selectedYear}
                </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          {/* Section 1: Overview (Time Series - Unaffected by Year Selector visually, but contextually relevant) */}
          <section>
            <OverviewChart />
          </section>

          {/* Section 2 & 3: Spenders & Earners */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendersPanel data={currentData} />
            <EarnersPanel data={currentData} />
          </section>

          {/* Section 4: Funds */}
          <section>
            <FundsPanel data={currentData} />
          </section>
        </div>

        <footer className="mt-12 text-center text-slate-400 text-sm py-4 border-t border-slate-200">
          <p>© 2024 FiscalInsight (Simulated Data Demo)</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
