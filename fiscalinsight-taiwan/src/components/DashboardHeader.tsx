import React from 'react';

const DashboardHeader: React.FC = () => {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Fiscal-Visualization-Taiwan</h1>
      <p className="text-slate-500 mt-2 max-w-2xl">
        Hello! 歡迎來到個人嘗試開發的財政視覺化小專案，整理了 2008 至 2025 年的台灣官方財政數據。歡迎分享你的建議或是想法！
      </p>
    </header>
  );
};

export default DashboardHeader;
