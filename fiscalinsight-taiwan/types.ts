export type Period = string;

export interface CategoryItem {
  name: string;
  abbr: string;
  amount: number; // Can be raw int or billion float
}

export interface OverviewSection {
  total: number; // Can be raw int or billion float
  breakdown: Record<string, CategoryItem>;
}

export interface OverviewData {
  year: number;
  revenue: OverviewSection;
  expenditure: OverviewSection;
}

export interface FundItem {
  name: string;
  income: number;
  expense: number;
}

export interface FundYearData {
  year: number;
  items: FundItem[];
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
