# Taiwan Government Budget Analysis (Years 97-114)

## 1. File Inventory & Meaning

The dataset consists of Excel files from ROC Years 97-114 (1998-2025). The naming convention varies by year (e.g., `97c[...]` or `C[...]`), but the core types remain consistent.

### Comparison & Summary
| Filename | Meaning | Key Characteristics |
| :--- | :--- | :--- |
| **`C歲入歲出簡明比較分析表.xlsx`** | **Budget Summary Comparison** | High-level executive summary. Compares Total Revenue vs Total Expenditure, and YoY growth. **Not for raw data ingestion.** |
| **`C基金別預算分析表.xlsx`** | **Fund Budget Analysis** | Breakdowns by "Funds" (e.g., Special Funds, Trust Funds) rather than General Budget agencies. |

### Expenditure (歲出) - The Spending
| Filename | Meaning | Structure | Strategy |
| :--- | :--- | :--- | :--- |
| **`C歲出機關別預算表.xlsx`** | **Expenditure by Agency** (Master File) | **Hierarchical List**: Agency (款) $\rightarrow$ Dept (項) $\rightarrow$ Program (目) $\rightarrow$ Account (節). Contains the line-item details. | **PRIMARY SOURCE**. Ingest this to get the "Who" and "What Item". |
| **`C歲出政事別預算表.xlsx`** | **Expenditure by Function** | **Hierarchical List**: Function (款) $\rightarrow$ Sub-function (項) $\rightarrow$ Program (目). Organized by purpose (e.g., Education, Defense). | **SECONDARY**. Use to map Programs to Functions if not clear in the Agency file. |
| **`C各機關歲出政事別科目分析總表.xlsx`** | **Agency x Function Matrix** | **Pivot Table/Matrix**: Columns = Agencies, Rows = Functions (or Accounts). Shows the intersection. | **VALIDATION**. Use to verify that Sum(Agency A) matches the total in the Master File. |

### Revenue (歲入) - The Income
| Filename | Meaning | Structure | Strategy |
| :--- | :--- | :--- | :--- |
| **`C歲入來源別預算表.xlsx`** | **Revenue by Source** (Master File) | **Hierarchical List**: Source Group (款) $\rightarrow$ Source Item (項) $\rightarrow$ Detail (目). | **PRIMARY SOURCE**. Ingest this for all Revenue data. |
| **`C各機關歲入來源別科目分析總表.xlsx`** | **Agency x Source Matrix** | **Pivot Table/Matrix**: Shows which agency collects which revenue. | **VALIDATION**. |

---

## 2. Detailed Verification of "Master Files"

We identified `C歲出機關別預算表.xlsx` and `C歲入來源別預算表.xlsx` as the most critical files.

### Why `C歲出機關別預算表.xlsx`?
*   **Granularity**: It contains the 4-level hierarchy:
    *   **款 (Top)**: Main Agency (e.g., 總統府)
    *   **項 (Mid)**: Sub-unit (e.g., 中央研究院)
    *   **目 (Program)**: Specific Program (e.g., 一般行政)
    *   **節 (Account)**: Economic Category (e.g., Personnel, Equipment)
*   **Completeness**: This is the legal budget representation. Every dollar must be accounted for here.

### Why not the "Analysis Tables" (`分析總表`)?
*   These are usually **aggregated views** (Crosstabs) useful for humans to glance at "How much is Education spending?", but they often flatten the lower-level line items (`節`).
*   Parsing matrices (Headers in Row 2, Agency names in Columns B-Z) is error-prone compared to parsing a standardized list.

---

### 3. Data Processing Strategy (Unified Reference)

To support cross-year comparison and simplify frontend logic, we will consolidate all budget items into a single unified dataset using a reproducible Python script.

**Implementation Approach (Content-Based):**
Since filenames in some years (e.g., Year 99) are non-descriptive numeric strings, we cannot rely on filename matching.
We will create a Python script `src/scripts/etl_budget.py` that:
1.  **Iterates** through every `.xls` / `.xlsx` file in `docs/tw-finance/{year}/`.
2.  **Identifies File Type** by inspecting reading the first few rows (headers).
    *   **Expenditure Match Rule**: Contains columns/headers for `款`, `項`, `目`, `節` AND `機關`.
    *   **Revenue Match Rule**: Contains columns/headers for `款`, `項`, `目`, `節` AND `來源` (or similar).
3.  **Process**: once identified, apply the extraction logic.
4.  **Convert Year**: ROC to AD.
5.  **Unify**: Append to `budget_all.csv`.

**Robust Transformation Rules:**
*   **Rule 1**: If headers are distinct (Revenue vs Expenditure), process accordingly.
*   **Rule 2**: If file is unidentified, log a warning and skip.
*   **Rule 3**: Handle Schema Drift (e.g., if Year 99 uses different header names, add alias mapping).

**Output File**: `data/unified/budget_all.csv` (and `.json`)

**Unified Schema:**
This schema normalizes both Revenue and Expenditure data.

| Column | Type | Description |
| :--- | :--- | :--- |
| `year` | Integer | AD Year (e.g., `2025`) |
| `type` | String | `Revenue`, `Expenditure`, or `Fund` |
| `category_1` | String | Top Level (e.g., Agency Top or Source Group) |
| `category_2` | String | Sub Level (e.g., Agency Unit or Source Type) |
| `item_name` | String | Specific Item (e.g., Program or Detail) |
| `account_name` | String | Account Name (if applicable) |
| `amount` | Integer | Budget Amount (TWD) |
| `source_file` | String | Origin filename for traceability |

### 3.1 Mapping Rules

**Expenditures (`C歲出機關別預算表.xlsx` → `budget_all.csv`)**
*   `type` = "Expenditure"
*   `category_1` $\leftarrow$ `Agency Top` (款)
*   `category_2` $\leftarrow$ `Agency Sub` (項)
*   `item_name` $\leftarrow$ `Program` (目)
*   `account_name` $\leftarrow$ `Account` (節)
*   `amount` $\leftarrow$ `Amount`

**Revenues (`C歲入來源別預算表.xlsx` → `budget_all.csv`)**
*   `type` = "Revenue"
*   `category_1` $\leftarrow$ `Source Group` (款)
*   `category_2` $\leftarrow$ `Source Type` (項)
*   `item_name` $\leftarrow$ `Detail` (目)
*   `account_name` $\leftarrow$ `null` / Empty
*   `amount` $\leftarrow$ `Amount`

**Funds (`C基金別預算分析表.xlsx` → `budget_all.csv`)**
(Note: Funds will be flattened. Income and Expense usually distinct rows or separate type if schema permits, but for now we keep Funds in separate file `funds.csv` OR map them if user insists. *Decision*: Keep Funds separate for now due to "Inbox/Expense/Surplus" structure being different from single-column budget lines. We will focus on Unified Budget first.)

**Strategy Update**:
We will generate:
1.  **`budget_all.csv`**: Combined Revenues and Expenditures.
2.  **`funds.csv`**: Special Fund details (kept separate due to different dimensionality).
3.  **`summary.csv`**: High-level YoY comparison.

### 3.3 Fund Budget Data Construction
*   **Source File**: `C基金別預算分析表.xlsx`
*   **Output File**: `data/114/funds.csv` (and `.json`)
*   **Description**: Breakdown of budgeting by Special Funds and Trust Funds.

**Data Format (Schema):**

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `year` | Integer | AD Year (e.g., `2025`) |
| `fund_type` | String | Type of Fund (e.g., 非營業特種基金) | `作業基金` |
| `fund_name` | String | Name of the Fund | `國立大學校院校務基金` |
| `agency_name` | String | Managing Agency | `教育部` |
| `income` | Integer | Total Income (TWD) | `20000000` |
| `expense` | Integer | Total Expense (TWD) | `18000000` |
| `surplus_deficit`| Integer | Surplus/Deficit (TWD) | `2000000` |

### 3.4 Summary Comparison Data
*   **Source File**: `C歲入歲出簡明比較分析表.xlsx`
*   **Output File**: `data/114/summary.csv` (and `.json`)
*   **Description**: High-level totals and YoY growth rates for the Overview dashboard.

**Data Format (Schema):**

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `year` | Integer | AD Year (e.g., `2025`) |
| `category` | String | Category (Revenue/Expenditure) | `歲出` |
| `amount` | Integer | Amount (TWD) | `3000000000` |
| `comparison_amount`| Integer | Previous Year Amount | `2900000000` |
| `growth_rate` | Float | YoY Growth % | `3.45` |

---

## 4. Presentation & Visualization Strategy

All visualizations must present **Real Values (TWD)** and **Percentages (%)**.

### 4.1 Dashboard Layout Priority

1.  **Overview (Level 0)**: High-level summary of the entire state.
2.  **Breakdown (Level 1)**: Detailed attribution of "Who earns" and "Who spends".
3.  **Deep Dive (Level 2)**: Hierarchical exploration.

### 4.2 Visualization Specifications

| Section | Chart Type | Data Source | Purpose & Design Rules |
| :--- | :--- | :--- | :--- |
| **1. Overview** | **Line Chart** (Trend) | Summary/Comparison Data | **Total Expenditure & Revenue over years**.<br>• Show Trend Line for absolute values.<br>• Tooltip/Label: Show % YoY Change. |
| **2. Spenders** | **Donut Chart** | `expenditures.csv` | **Who spends? (Composition)**<br>• Segments: Top 5 Agencies + "Others".<br>• Label: Agency Name + Amount + %. |
| **2. Spenders** | **Bar Chart** | `expenditures.csv` | **Who spends? (Ranking)**<br>• Bars: Top 5 Agencies.<br>• Axis: Amount (TWD).<br>• Annotation: % of Total Budget. |
| **3. Earners** | **Donut Chart** | `revenues.csv` | **Who earns? (Composition)**<br>• Segments: Top 5 Source Groups (e.g., Taxes) + "Others".<br>• Label: Source Name + Amount + %. |
| **3. Earners** | **Bar Chart** | `revenues.csv` | **Who earns? (Ranking)**<br>• Bars: Top 5 Revenue Sources.<br>• Annotation: % of Total Revenue. |
| **4. Funds** | **Grouped Bar** | `funds.csv` | **Fund Performance**<br>• Bars: Income vs. Expense per Fund Type.<br>• Goal: Highlight surplus vs. deficit. |
