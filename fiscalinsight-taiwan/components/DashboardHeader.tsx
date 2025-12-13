import React from 'react';

const DashboardHeader: React.FC = () => {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">FiscalInsight Taiwan</h1>
      <p className="text-slate-500 mt-2 max-w-2xl">
        Interactive visualization of simulated government fiscal data spanning 12 years and three administrative periods.
        Analyze trends, compare administrative priorities, and explore annual budget breakdowns.
      </p>
    </header>
  );
};

export default DashboardHeader;
