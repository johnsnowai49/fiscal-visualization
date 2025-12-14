# Taiwan Budget Data Transformation Spec (v3.0.0)

## 1. Overview
This specification details the process of transforming raw Excel (`.xls`, `.xlsx`) budget files from the Directorate General of Budget, Accounting and Statistics (DGBAS) into standardized JSON files for consumption by the frontend application.

The goal is to bypass potential encoding issues and complexity of intermediate CSVs and directly produce clean, hierarchical (where applicable) JSON data.

## 2. Source Data
- **Location**: `docs/tw-finance/{year}/`
- **Years**: ROC Year 97 (2008) to 114 (2025).
- **Format**: Microsoft Excel (`.xls` for older years, `.xlsx` for newer).

## 3. Transformation Logic

### 3.1 File Identification
Since filenames vary across years (especially Year 99), the script primarily identifies files by **Content Inspection** (reading header rows), with Filename Fallback.

| Target JSON | Matching Excel Content Keywords | Filename Keyword |
| :--- | :--- | :--- |
| `summary.json` | `歲入歲出簡明比較` OR (`歲入合計` AND `歲出合計`) | `C歲入歲出簡明比較分析表` |
| `funds.json` | `基金別預算` | `C基金別預算分析表` |
| `revenue_by_source.json` | `歲入來源別` OR (`來源` AND `科目`) | `C歲入來源別預算表` |
| `expenditure_by_agency.json` | `歲出機關別` OR (`機關` AND `科目`) | `C歲出機關別預算表` |
| `expenditure_by_function.json`| `歲出政事別` OR (`政事` AND `科目`) | `C歲出政事別預算表` |

### 3.2 Hierarchy Parsing (For Revenue & Expenditure)
The main budget tables (Agency, Function, Source) follow a hierarchical column structure:
- **Level 1 (Top)**: `款` (Kuan) - e.g., "General Administration"
- **Level 2**: `項` (Xiang) - e.g., "National Security Bureau"
- **Level 3**: `目` (Mu) - e.g., "Admin Management"
- **Level 4 (Leaf)**: `節` (Jie) - e.g., "Personnel Expenses"

**Parsing Rules:**
1. **Stateful Traversal**: Iterate row by row. Maintain the "Current" value for each level (`curr_kuan`, `curr_xiang`, `curr_mu`).
2. **Reset Logic**: When a new Level 1 appears, reset Level 2, 3, 4. When a new Level 2 appears, reset Level 3, 4.
3. **Value Extraction**: Capture the `Amount` (本年度預算數).
4. **Inheritance**: Each data row inherits the parent levels currently in state.

## 4. JSON Output Formats

### 4.1 Summary (`summary.json`)
High-level comparison of specific aggregated categories.

```json
[
  {
    "year": 2025,
    "type": "revenue", // or "expenditure"
    "category": "Tax Revenue",
    "amount": 2500000000
  },
  ...
]
```

### 4.2 Funds (`funds.json`)
List of special funds and their financial status.

```json
[
  {
    "year": 2025,
    "fund_name": "National Development Fund",
    "income": 5000000,
    "expense": 3000000,
    "surplus": 2000000
  },
  ...
]
```

### 4.3 Revenue by Source (`revenue_by_source.json`)
Hierarchical data representing sources of income.

```json
[
  {
    "year": 2025,
    "top_category": "Tax Revenue", // from 款
    "sub_category": "Income Tax",  // from 項
    "detail_item": "Individual Income Tax", // from 目
    "amount": 10000000
  },
  ...
]
```

### 4.4 Expenditure by Agency (`expenditure_by_agency.json`)
Hierarchical spending by government agency.

```json
[
  {
    "year": 2025,
    "agency_top": "Office of the President", // from 款
    "agency_sub": "Academia Sinica", // from 項
    "program": "General Administration", // from 目
    "account": "Personnel", // from 節 (Optional, may be null if aggregate)
    "amount": 5000000
  },
  ...
]
```

### 4.5 Expenditure by Function (`expenditure_by_function.json`)
Hierarchical spending by functional category (Education, Defense, etc.).

```json
[
  {
    "year": 2025,
    "function_top": "Education Science and Culture", // from 款
    "function_sub": "Education", // from 項
    "program": "National Education", // from 目
    "amount": 8000000
  },
  ...
]
```

## 5. Year Conversion
- All input files use **Republic of China (ROC) Calendar** (e.g., Year 114).
- Output JSON must use **AD Year** (ROC Year + 1911).
- Example: `114` -> `2025`.
