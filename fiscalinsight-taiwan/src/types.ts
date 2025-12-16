// Basic types
export type Period = string;

export interface CategoryItem {
  name: string;
  amount: number;
}

// Overview Data (summary.json)
export interface OverviewData {
  year: number;
  revenue: number;
  expenditure: number;
  revenue_categories: CategoryItem[];
  expenditure_categories: CategoryItem[];
}

// Funds Data (funds.json)
export interface FundTotal {
  revenue: number;
  expenditure: number;
}

export interface BasicFund {
  total: FundTotal;
  extra: FundTotal;
}

export interface SpecialFundDetail {
  name: string;
  type: string;
  revenue: number;
  expenditure: number;
}

export interface SpecialFund {
  total: FundTotal;
  details: SpecialFundDetail[];
}

export interface FundYearData {
  year: number;
  basic_fund: BasicFund;
  special_fund: SpecialFund;
}

// Detail Data (budget_detail.json) - Unchanged for now as it wasn't mentioned to change
export interface FlatBudgetItem {
  id: string;
  year: number;
  name: string[];
  amount: number;
  hierarchy: number[];
}

export interface BudgetDetailNode {
  name: string;
  value: number;
  children?: BudgetDetailNode[];
}

export interface BudgetDetailData {
  year: number;
  revenue: BudgetDetailNode[];
  expenditure: BudgetDetailNode[];
}
