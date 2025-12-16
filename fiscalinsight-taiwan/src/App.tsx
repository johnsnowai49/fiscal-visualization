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
  const [isPlaying, setIsPlaying] = useState(false);

  // Keyboard Control
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input (rough check)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft') {
        setSelectedYear(y => Math.max(y - 1, OVERVIEW_DATA[0].year));
        setIsPlaying(false);
      } else if (e.key === 'ArrowRight') {
        setSelectedYear(y => Math.min(y + 1, OVERVIEW_DATA[OVERVIEW_DATA.length - 1].year));
        setIsPlaying(false);
      } else if (e.code === 'Space') {
        e.preventDefault(); // Prevent scroll
        setIsPlaying(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto Play
  React.useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedYear(prev => {
          const max = OVERVIEW_DATA[OVERVIEW_DATA.length - 1].year;
          if (prev >= max) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentOverview = useMemo(() => {
    return OVERVIEW_DATA.find(d => d.year === selectedYear) || OVERVIEW_DATA[OVERVIEW_DATA.length - 1];
  }, [selectedYear]);

  const currentFunds = useMemo(() => {
    return FUNDS_DATA.find(d => d.year === selectedYear);
  }, [selectedYear]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 max-w-[1500px] mx-auto">
      <div className="">
        <DashboardHeader />

        {/* Global Controls */}
        <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur py-4 mb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className={`bg-slate-200 p-1 rounded-lg flex items-center`}>
              <button
                onClick={() => setView('overview')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setView('detail')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'detail' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Detail
              </button>
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-2 shadow-sm gap-4">
              {/* Controls */}
              <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isPlaying ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                  title={isPlaying ? "暫停 (空白鍵)" : "自動播放 (空白鍵)"}
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>
                <div className="hidden md:flex items-center text-xs text-slate-400 gap-1" title="使用鍵盤左右鍵">
                  <span className="border border-slate-300 rounded px-1 min-w-[20px] text-center">←</span>
                  <span className="border border-slate-300 rounded px-1 min-w-[20px] text-center">→</span>
                </div>
              </div>

              {/* Slider */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">{OVERVIEW_DATA[0].year}</span>
                <input
                  type="range"
                  min={OVERVIEW_DATA[0].year}
                  max={OVERVIEW_DATA[OVERVIEW_DATA.length - 1].year}
                  value={selectedYear}
                  onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setIsPlaying(false); }}
                  className="w-32 md:w-64 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-xs font-bold text-slate-400">{OVERVIEW_DATA[OVERVIEW_DATA.length - 1].year}</span>
              </div>

              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded">
                {selectedYear} 年度
              </span>
            </div>
          </div>
        </div>

      </div>

      {view === 'overview' ? (
        <div className="flex flex-col gap-6">
          <section>
            <OverviewChart selectedYear={selectedYear} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendersPanel data={currentOverview.expenditure_categories} total={currentOverview.expenditure} year={selectedYear} />
            <EarnersPanel data={currentOverview.revenue_categories} total={currentOverview.revenue} year={selectedYear} />
          </section>

          <section>
            {currentFunds && <FundsPanel data={currentFunds} allData={FUNDS_DATA} year={selectedYear} />}
          </section>
        </div>
      ) : (
        <BudgetDetailDashboard year={selectedYear} onBack={() => setView('overview')} />
      )}

      <footer className="mt-12 text-center text-slate-400 text-sm py-4 border-t border-slate-200">
        <p>
          © 2025 Fiscal-Visualization-Taiwan
          <span className="mx-2">|</span>
          資料來源：<a href="https://www.dgbas.gov.tw/cp.aspx?n=3623&s=1208#Anchor_11333" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">行政院主計總處</a>
          <span className="mx-2">|</span>
          Contact: <a href="mailto:johnsnowai49@gmail.com" className="hover:text-slate-600 transition-colors">johnsnowai49@gmail.com</a>
        </p>
      </footer>
    </div>
  );
};

export default App;
