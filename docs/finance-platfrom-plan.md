# 🇹🇼 Finance Platform Plan: Taiwan Fiscal Trend Analysis Platform

## 📊 Overview

### 1. Goal & Rationale

* **Goal:** To establish a zero-backend-dependency, low-maintenance static web application for visualizing 16 years of central government fiscal data (Revenue and Expenditure). The platform aims to resolve the difficulty citizens face when attempting to manually compare data across different annual budget reports.
* **Timeframe:** 16 continuous years (covering the Ma Ying-jeou to Tsai Ing-wen administrations).

### 2. Core Requirements

| Requirement Type | Description | Key Technical Point |
| :--- | :--- | :--- |
| **Tech Stack** | Frontend uses **React** for component structure and **D3.js** for high-fidelity, custom data visualization. | Prioritize performance and component-level data handling. |
| **Data Source** | **Static CSV Files** (read directly by the browser). No dedicated database is used. | All complex aggregation and normalization must be completed in the preprocessing stage (Python/Pandas). |
| **Interactivity** | High interaction is required, including dynamic filtering by year/period. | Utilize React's state management (`useState`, `useMemo`) to filter and update D3/ECharts views. |
| **Maintenance** | Deployment as a **static website** (e.g., Vercel, Netlify) to achieve **zero backend maintenance cost**. | |

### 3. Sub-Pages & Visualization Plan

| Page Name | Core Content | Recommended Chart Type |
| :--- | :--- | :--- |
| **Overview** | Historical trend of Total Revenue vs. Total Expenditure (including special budgets). **Dynamic Playback Feature.** | **Stacked Area/Line Chart** with animated timeline (using D3 transitions). |
| **Revenue (歲入)** | Annual change and proportion of **major revenue items** (e.g., Tax, Fees, Public Debt). | **Stacked Area Chart** (for annual change) and **Treemap/Donut Chart** (for proportion). |
| **Expenditure (歲出)** | Annual change and proportion of **major expenditure items** (e.g., Education, Social Welfare, Defense). | **Stacked Area Chart** and **Sankey Diagram** (to show flow/allocation). |
| **Detailed Analysis** | Tracking the **Top 10 most dynamic sub-items** (both revenue and expenditure) over the years. | **Bar Chart (Top N)** and **Small Multiples Line Charts** (for specific items). |

## 🛠️ Tech Design

### 1. Data Model Design (CSV Structure)

The complex fiscal data will be pre-processed into three simple, static CSV files for easy frontend consumption.

| CSV File Name | Data Type | Core Fields (Example) | Usage |
| :--- | :--- | :--- | :--- |
| `data/annual_summary.csv` | **Trend Data** | `year`, `revenue_total`, `expenditure_total`, `period_name` | Overview, Playback |
| `data/revenue_breakdown.csv` | **Revenue Structure** | `year`, `major_category_standardized`, `amount`, `proportion` | Revenue Page, Proportions |
| `data/expenditure_breakdown.csv`| **Expenditure Structure** | `year`, `policy_area_standardized`, `amount`, `proportion` | Expenditure Page, Proportions |

### 2. Frontend Architecture & Interactivity

* **Visualization:** **D3.js** will be utilized to maintain a low bundle size and enable highly custom visualizations required for the dynamic playback feature.
* **Data Loading:** Use `d3-fetch` to load CSV files once upon component mount. All subsequent filtering and aggregation are done locally via JavaScript/D3-array functions.
* **Dynamic Playback Feature:**
    * **Mechanism:** Implement a React component with a state variable for the `currentYear`. A button (labeled "Play" or "Animate") will trigger a `setInterval` function that increments `currentYear` state (e.g., every 500ms).
    * **D3 Implementation:** The D3 rendering function will subscribe to the `currentYear` state. When `currentYear` changes, D3 will use **transitions** (e.g., `d3.transition()`) to smoothly update the chart elements (bars, lines, colors) to the new year's data, creating an animation effect. 

### 3. Data Processing Pipeline (Python/Pandas)

* **Tool:** Python (Pandas)
* **Crucial Step: Standardization:** A comprehensive mapping table must be created to align 16 years of potentially inconsistent budget item names (e.g., **歲入來源別, 歲出政事別**) to a fixed set of **5-8 standardized, plain-language categories**.

## 🚀 Implementation & Success Criteria

### 1. Implementation Steps

| Stage | Task Description | Deliverable |
| :--- | :--- | :--- |
| **I. Data Preparation** | 1. Data extraction from 16 years of reports (prioritizing Excel/ODS). 2. **Standardization mapping** and Pandas scripting for cleaning, aggregation, and proportion calculation. | Three finalized, clean **CSV files**. |
| **II. Core Development** | 1. Set up React project and structure. 2. Implement the **Playback Component Logic** (`useState` for year, `setInterval`). 3. Load and parse CSV data. | **Overview** page with static trend chart and working state management for dynamic year changes. |
| **III. Playback & Transitions** | Implement the **D3 rendering logic** to subscribe to the `currentYear` state and use **D3 transitions** to animate the chart elements. | Working **Dynamic Playback** on the Overview chart. |
| **IV. Structure & Detail** | Implement Revenue and Expenditure pages, including **Treemap/Sankey** visualizations and **Top 10 filtering** logic. | All sub-pages and interactive elements completed. |
| **V. Final Polish** | Code review, performance optimization (memoization), and deployment to a static hosting service. | Website formally launched. |

### 2. Success Criteria

* **Zero Backend:** The final website must operate entirely from static files, with no server-side processing required after deployment.
* **Data Accuracy:** All figures are directly traceable to the pre-processed CSV and adhere to the standardized category mapping.
* **Interactivity & Playback:** The dynamic playback function runs smoothly, allowing users to visually grasp the pace and magnitude of fiscal change over time.
* **Usability:** The UI/UX is intuitive, allowing the public to easily filter, compare periods, and understand the data narrative.