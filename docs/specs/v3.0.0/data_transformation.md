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
- terget xlsx: C歲入歲出簡明比較分析表

xlsx hierarchical data structure:
```
一、歲入合計 // sum of revenue, 5 categories at most in whole years
　　1.稅課收入
　　2.營業盈餘及事業收入
　　3.規費及罰款收入
　　4.財產收入
　　5.其他收入
二、歲出合計 // sum of expenditure, 9 categories at most in whole years
　　1.一般政務支出
　　2.國防支出
　　3.教育科學文化支出
　　4.經濟發展支出
　　5.社會福利支出
　　6.社區發展及環境保護支出
　　7.退休撫卹支出
　　8.債務支出
　　9.補助及其他支出
三、歲入歲出餘絀 // profit
```

```json
[
  {
    "year": 2025,
    "revenue": 123123,
    "expenditure": 2342342,
    "revenue_categories": [
      {
        "name": "稅課收入",   
        "amount": 2500000000
      },
      ...
    ],
    "expenditure_categories": [
      {
        "name": "國防支出",
        "amount": 2500000000
      },
      ...
    ]  
  },
  ...
]
```

### 4.2 Funds (`funds.json`)
List of special funds and their financial status.
- terget xlsx: C基金別預算分析表

xlsx hierarchical data structure:
```
  一、普通基金 // basic
    (一)總預算部分 // total
    (二)特別預算部分 // extra
  二、特種基金 // special
    (一)營業部分 // business
      中央銀行
    (二)非營業部分－作業基金 // operation
      行政院國家發展基金
    (三)非營業部分－債務基金 // debt
      中央政府債務基金
    (四)非營業部分－特別收入基金 // special income
      中央研究院科學研究基金
    (五)非營業部分－資本計畫基金 // capital plan
      xxx研究基金
```

json format
```json
[
    {
        "year": 2025,
        "basic_fund": {
          "total": {
            "revenue": 10000000,
            "expenditure": 20000000,
          },
          "extra": {
            "revenue": 10000000,
            "expenditure": 20000000,
          }
        },
        "special_fund": {
          "total": {
            "revenue": 10000000,
            "expenditure": 20000000,
          },
          "details": [
            {
              "name": "中央銀行",
              "amount": 10000000,
              "type": "business"
            },
            {
              "name": "行政院國家發展基金",
              "amount": 10000000,
              "type": "operation"
            },
            ...
          ]
        }
    },
]
```

### 4.3 Revenue by Source (`revenue_by_source.json`)
Hierarchical data representing sources of income.
- terget xlsx: C歲入來源別預算表

json format
```json
[
    {
        "id": "0100000000",
        "year": 2025,
        "name": ["稅課收入"], //may have multiple name ,
        "amount": 10000000,
        "hierarchy": [1,0,0,0], //款	項	目	節
    },
]
```

### 4.4 Expenditure by Function (`expenditure_by_function.json`)
Hierarchical spending by functional category (Education, Defense, etc.).
- terget xlsx: C歲出政事別預算表

json format
```json
[
    {
        "id": "0100000000", //Functional id
        "year": 2025,
        "name": ["總統府"], //may have multiple name ,
        "amount": 10000000,
        "hierarchy": [1,1,0,0], //款	項	目	節
    },
]
```

## 5. Year Conversion
- All input files use **Republic of China (ROC) Calendar** (e.g., Year 114).
- Output JSON must use **AD Year** (ROC Year + 1911).
- Example: `114` -> `2025`.
