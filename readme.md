# fiscal-visualization

## Overview
This platform visualizes **16 years of Taiwan's Central Government Budget data** (ROC 97-114 / AD 2008-2025). It aims to provide clear insights into revenue sources, expenditure trends, and special funds performance through an interactive web dashboard.

**Data Source**: [Directorate-General of Budget, Accounting and Statistics (DGBAS)](https://www.dgbas.gov.tw/cp.aspx?n=3623)

## Features
*   **Unified Data**: Consolidates heterogeneous Excel files (different formats/headers over 16 years) into standard CSVs.
*   **Hierarchical Analysis**: Preserves the Agency -> Department -> Program structure.
*   **Trend Playback**: Visualize how budget priorities shift over time (Frontend TBD).

## Data Pipeline (ETL)
The project uses a Python-based ETL pipeline to process raw Excel files from `docs/tw-finance/`.

### Prerequisites
*   Python 3.x
*   Dependencies: `pandas`, `openpyxl`, `xlrd`

### Running the ETL
To regenerate the unified datasets:
```bash
# 1. Activate virtual environment (optional)
source .venv/bin/activate

# 2. Run the script
python src/scripts/etl_budget.py
```

### Outputs (`data/unified/`)
1.  **`budget_all.csv`**: Main hierarchical dataset (Revenue & Expenditure).
2.  **`funds_all.csv`**: Special Funds (leaf nodes only).
3.  **`summary_all.csv`**: High-level YoY comparison.

## Web Application (Frontend)
*Directory: `fiscalinsight-taiwan/`*

The frontend is a modern, interactive dashboard built with:
*   **React** (Vite)
*   **TypeScript**
*   **ECharts** (for high-performance data visualization)
*   **Tailwind CSS**

### Features
*   **Total Overview**: Revenue vs Expenditure trends (YoY).
*   **Interactive Panels**: Drill down into Spenders (Agencies), Earners (Sources), and Funds.
*   **Budget Detail Explorer**: Hierarchical view of budget items.
*   **Fully Localized**: Traditional Chinese UI for local accessibility.

### Setup
```bash
cd fiscalinsight-taiwan
npm install
npm run dev
```

For more details, please refer to the [Frontend README](fiscalinsight-taiwan/README.md).

## Directory Structure
*   `agile/`: Project management and task tracking.
*   `data/`: Generated CSV/JSON data.
*   `docs/`: Source Excel files (`tw-finance/`) and Specifications (`specs/`).
*   `src/scripts/`: ETL and utility scripts.