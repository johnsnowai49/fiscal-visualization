# System Design: Fiscal Trend Analysis Platform (v1.1.0)

## 1. Overview
The **Taiwan Fiscal Trend Analysis Platform** is a Single Page Application (SPA) dashboard designed to visualize 16 years (2008-2025) of government budget data. It provides interactive trends, breakdowns, and a "Playback" feature to see fiscal changes over time.

## 2. Technology Stack
*   **Build Tool**: [Vite](https://vitejs.dev/) (Fast, lightweight, Pure React setup).
*   **Framework**: React (TypeScript).
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first).
*   **Visualization**: [D3.js](https://d3js.org/) (Custom charts & playback).
*   **Data Format**: **CSV** (Best for file size efficiency).
*   **Data Parsing**: [PapaParse](https://www.papaparse.com/) (Client-side CSV parsing).

## 3. Architecture
### 3.1 Data Loading Strategy
*   **Assets**: CSV files (`budget_all.csv`, `funds_all.csv`, `summary_all.csv`) stored in `public/data/unified/`.
*   **Fetching**: Fetch CSV file -> Parse with PapaParse -> Store in Context.
*   **State**: Global `BudgetContext` stores the structured data.
*   **Performance**: 13MB CSV is acceptable for client-side loading (gzipped ~3MB). Show a progress bar during initial load.

### 3.2 Routing (SPA)
*   **Library**: `react-router-dom` (Standard for SPAs).
*   **Routes**:
    *   `/` (Home): Overview Dashboard (Summary Trends).
    *   `/breakdown`: Hierarchical Explorer (Treemap/Sunburst).
    *   `/funds`: Special Funds Analysis.

## 4. Visualization Components (D3.js)
1.  **Trend Playback**: Animated Line/Area chart scrolling through 2008-2025.
2.  **Breadcrumb Explorer**: Drill-down interactions (Ministry -> Dept -> Program).
3.  **Comparison View**: Multi-select layout comparisons.

## 5. Implementation Roadmap (T-00001-002)
1.  **Init**: `npm create vite@latest` (Template: React + TS).
2.  **ETL Update**: Modify `etl_budget.py` to export **JSON** alongside CSV.
3.  **Data Layer**: Create `useBudget` hook to fetch and cache JSON data.
4.  **Layout**: Responsive App Shell (Sidebar/Header).
