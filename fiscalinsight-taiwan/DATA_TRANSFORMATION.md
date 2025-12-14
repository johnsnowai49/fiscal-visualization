# Data Transformation Documentation

This document describes the ETL (Extract, Transform, Load) process used to convert raw government budget CSV files into the `fiscal_data.json` consumed by the React frontend.

## Overview

The `fiscalinsight-taiwan` app avoids parsing large CSV files in the browser for performance reasons. Instead, we use a Python script (`scripts/convert_data.py`) to pre-process the data into a lightweight, typed JSON structure.

**Data Flow:**
**Data Flow:**
`Raw CSVs (data/unified/*.csv)` -> `Python Script (v2)` -> `JSON (src/data/raw/*.json, src/data/billion/*.json)` -> `React App`

## 1. Source Data

The source data is located in `fiscalinsight-taiwan/data/unified/`:
- **`summary_all.csv`**: Contains yearly totals for high-level categories (e.g., "Tax Revenue", "Defense Expenditure").
- **`funds_all.csv`**: Contains detailed income and expense data for individual government funds.

## 2. Transformation Logic (`scripts/convert_data_v2.py`)

The python script performs the following transformations:

### A. Dual Output
The script generates two sets of JSON files:
1.  **`src/data/raw/`**: Contains original integer values (NT$).
2.  **`src/data/billion/`**: Contains pre-scaled float values (Billions NT$) for frontend visualization.

### B. Category Mapping (Strict)
We map the data into **14 Strict Categories** (5 Revenue, 9 Expenditure) as defined in `docs/specs/category_map.json`.

#### Revenue (5 Categories)
- Tax Revenue (稅課收入)
- Business Income (營業盈餘及事業收入)
- Fees & Fines (規費及罰款收入)
- Property Income (財產收入)
- Other Revenue (其他收入)

#### Expenditure (9 Categories)
- General Administration (一般政務支出)
- National Defense (國防支出)
- Education, Science & Culture (教育科學文化支出)
- Economic Development (經濟發展支出)
- Social Welfare (社會福利支出)
- Community Development & Env (社區發展及環境保護支出)
- Pension & Survivor (退休撫卹支出)
- Debt Servicing (債務支出)
- Subsidies & Others (補助及其他支出)

### C. Funds Processing
- Generates `funds.json` sorted by Income (Top 10 logic is handled in Frontend).

## 3. Usage

To regenerate the data:

```bash
# From the project root
python3 fiscalinsight-taiwan/scripts/convert_data_v2.py
```

This will overwrite files in `fiscalinsight-taiwan/src/data/raw` and `fiscalinsight-taiwan/src/data/billion`.

## 4. Design Decisions (FAQ)

### Why was `budget_all.csv` not used?
`budget_all.csv` contains highly detailed, potentially hierarchical data (Department -> Program -> Item). The existing interactive dashboard relies on high-level aggregations (e.g., total "Defense" vs. "Education"). For the purpose of this visual refactor, `summary_all.csv` provided efficiently aggregated totals that matched the scope of the existing UI components without the overhead of processing thousands of granular line items.

### Why define custom categories instead of using Taiwan government rules?
The current categories (`education`, `defense`, etc.) are legacy artifacts from the original frontend design which aimed for a simplified, "simulated" view. While we are now using real government data, we mapped the official functional categories ("政事別") to these simplified buckets to preserve the existing UI layout and logic.
**Future Improvement:** A full adherence to the official "Functional Classification" (General Administration, National Defense, Education, Economic Development, Social Welfare, Community Development, Retirement, Debt, etc.) would be better for a public-facing tool to ensure strict alignment with official terminology.

### Why not save original NT values and calculate in the frontend?
Storing values in Billions in the JSON was a performance optimization to reduce file size and simplify client-side arithmetic.
**Updated Strategy:** We agree that for transparency and verification, the original values are essential.
- **Plan:** We will store **two** fields in the future `fiscal_data.json`:
    - `amount_raw`: (Integer) The exact NT$ value from the government CSV.
    - `amount_billions`: (Float) The pre-calculated value for quick high-level visualization.
- **Verification:** We will use `amount_raw` to run continuous integration tests against the original CSV totals to ensure 0% deviation.

## 5. Advanced Data Strategy (Responses to Feedback)

### 1. Handling Hierarchical Data (`budget_all.csv`)
**Question:** How do you plan to handle the detailed hierarchy (e.g., Ministry of Finance -> Heritage Tax -> Gift Tax) in `budget_all.csv`?
**Strategy:**
`budget_all.csv` contains the granular breakdown required for deep-dive analysis. To expose this to the public without overwhelming the initial view:
1.  **Data Structure**: We will parse `budget_all.csv` into a **Tree Structure** rather than flat lists.
    ```json
    {
      "name": "Ministry of Finance",
      "amount": 1203400000,
      "children": [
        {
          "name": "Estate & Gift Tax",
          "amount": 25000000,
          "children": [
             { "name": "Estate Tax", "amount": 15000000 },
             { "name": "Gift Tax", "amount": 10000000 }
          ]
        }
      ]
    }
    ```
2.  **Visualization**: We will implement a **Zoomable Treemap** or **Sunburst Chart** in the frontend. Users initially see the top-level agencies; clicking a block drills down into the detailed hierarchy defined in the CSV columns (`category_1` -> `category_2` -> `item_name`).

### 2. Standardized Mapping Table
**Question:** Should we create a formal map table (ID, Abbreviation, Chinese, English)?
**Strategy:** **Yes.** relying on string matching keywords in Python code is fragile.
We will create a foundational reference file: `docs/specs/category_map.json`:
| ID | Abbreviation | TC Name (Zh) | EN Name |
| :--- | :--- | :--- | :--- |
| `REV_TAX` | `tax` | `稅課收入` | `Tax Revenue` |
| `EXP_EDU` | `edu` | `教育科學文化支出` | `Education, Science & Culture` |
| ... | ... | ... | ... |

The Python script will load this Validator Map to assign categories, ensuring strict adherence to the defined schema and preventing unmapped "orphans".

### 3. Dual Value Storage (Raw vs Scaled)
**Question:** Should we keep original NT values? Performance optimization can come later.
**Strategy:** **Agreed.**
1.  **Source of Truth**: The application will load `amount_raw` (original NT$) by default.
2.  **Display Logic**: The frontend will format these large integers into Billions/Trillions only at the *last mile* (rendering).
3.  **Fallback**: We will only resort to pre-scaled values if we encounter significant frame drops when aggregating 20+ years of raw integers on mobile devices (unlikely for <1MB of data, but we will test).
4.  **Transparency**: A "View Raw Data" toggle can be added to the UI to let users inspect the exact government figures.

