# Fiscal Insight Taiwan v2.0.0 Specification

## Overview
This version upgrades the platform to use real historical data from Taiwan's central government budget (Years 97-114).

## Data Schema

### Source Data
The application will ingest three primary CSV datasets:
1. **`summary_all.csv`**: Yearly totals for major Revenue and Expenditure categories.
2. **`funds_all.csv`**: Yearly detailed income and expense for each Government Fund.
3. **`budget_all.csv`**: Detailed hierarchical budget items (Department -> Program -> Item).

### Frontend Data Model (`FiscalYearData`)
The frontend will continue to use the `FiscalYearData` interface, but populated from the CSVs.

```typescript
export interface FiscalYearData {
  year: number; // e.g., 2025
  period: Period; // Mapped from Year ranges
  totalRevenue: number;
  totalExpenditure: number;
  revenue: RevenueBreakdown;
  expenditure: ExpenditureBreakdown;
  funds: FundItem[];
  // New Optional Field for detailed exploration
  details?: BudgetDetailItem[]; 
}
```

## Data Mapping Rules

### Revenue Mapping (Source: `summary_all.csv` / `budget_all.csv`)
| Frontend Field | Source Category (Keywords) | Note |
| :--- | :--- | :--- |
| `tax` | `稅課及專賣收入`, `稅課收入` | Primary tax revenue |
| `fees` | `規費及罰款收入`, `規費`, `罰款` | Fees and Fines |
| `debt` | `公債及借款收入` (If present) | **Gap**: Need to verify where Borrowing is listed. |
| `other` | `營業盈餘及事業收入`, `財產收入`, `其他收入` | Surplus, Property, Others |

### Expenditure Mapping (Source: `summary_all.csv`)
| Frontend Field | Source Category (Keywords) | Note |
| :--- | :--- | :--- |
| `defense` | `國防支出` | |
| `education` | `教育科學文化支出` | Education, Science, Culture |
| `socialWelfare` | `社會福利支出`, `退休撫卹支出` | Combined Social Welfare & Pension |
| `infrastructure` | `經濟發展支出`, `社區發展及環境保護支出` | Proxies for Infrastructure |
| `administration` | `一般政務支出` | |

### Funds Mapping (Source: `funds_all.csv`)
- **Direct Mapping**:
    - `name` <- `fund_name`
    - `income` <- `income`
    - `expense` <- `expense`

## Implementation Strategy
1. **Data Conversion**: A pre-processing script (Python) will read the CSVs and generate a `src/data/fiscal_data.json` file. This is more efficient than parsing 20MB+ of CSV in the browser.
2. **Component Updates**:
    - `App.tsx` will import `fiscal_data.json`.
    - `UnitContext` usage remains same.
    - `Treemap` will need to use the `details` field (from `budget_all.csv`) if we want deep dive, otherwise stick to top-level.

## Requirements
- **Visual Continuity**: Keep the existing charts (Line, Stacked Bar, Treemap).
- **Data Accuracy**: Ensure strict adherence to the CSV values.
- **Performance**: Optimize initial load time.
