# 台灣財政透視 (Fiscal Insight Taiwan)

[English](./README.md) | [中文](./README.md)

**台灣財政透視** 是一個互動式資料視覺化專案，旨在清晰呈現中華民國政府自 **2008 年至 2025 年 (民國 97-114 年)** 的財政預算趨勢。本專案使用真實的政府公開數據，提供公眾一個更直觀的方式來理解國家財政狀況。

**Fiscal Insight Taiwan** is an interactive data visualization project designed to clearly present the fiscal budget trends of the R.O.C. government from **2008 to 2025**.

## 🌟 主要功能 (Key Features)

- **總覽儀表板 (Overview Dashboard)**:
    - **歲入歲出趨勢**: 視覺化呈現歷年財政收支變化與年增率。
    - **支出/收入結構**: 使用甜甜圈圖與長條圖分析各年度的資金來源與流向。
    - **基金分析**: 包含普通基金與特種基金的營運狀況分析。

- **預算明細探索 (Detailed Budget Explorer)**:
    - **層次化數據**: 支援從「款」、「項」、「目」、「節」的層層下鑽 (Drill-down) 功能。
    - **雙向分析**: 可切換檢視「歲入」(Revenue) 或「歲出」(Expenditure) 預算細目。
    - **歷史趨勢**: 點擊任意預算項目即可查看其跨年度的歷史金額變化。

- **全中文介面**: 專為台灣使用者設計的繁體中文介面，採用在地化財政術語 (如：歲入、歲出、賸餘、短絀)。

## 📊 資料來源 (Data Sources)

本專案資料來自 **[行政院主計總處 (DGBAS)](https://www.dgbas.gov.tw/cp.aspx?n=3623&s=1208#Anchor_11333)** 公開之中央政府總預算案。

- 資料範圍：民國 97 年至 114 年 (2008-2025)
- 資料格式：經過清理與標準化的 JSON 結構 (`data/unified/`)

## 🛠️ 技術架構 (Tech Stack)

- **Frontend**: [React](https://react.dev/) (v19), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Visualization**: [Apache ECharts](https://echarts.apache.org/) (via `echarts-for-react`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 🚀 快速開始 (Quick Start)

**Prerequisites:** Node.js (v18+)

1. **安裝套件 (Install dependencies):**
   ```bash
   npm install
   ```

2. **啟動開發伺服器 (Run development server):**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 to view the app.

3. **建置生產版本 (Build for production):**
   ```bash
   npm run build
   ```

## 📬 聯絡資訊 (Contact)

如有任何建議或問題，歡迎聯繫：
- **Email**: [johnsnowai49@gmail.com](mailto:johnsnowai49@gmail.com)

---

© 2025 Fiscal-Visualization-Taiwan | Real Data Edition
