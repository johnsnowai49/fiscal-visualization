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

// Detail Data (budget_detail.json)
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

// V3 Relational Data
export interface RelationalBudgetItem {
    id: string;
    name: string;
    amount: number;
    parent_id: string | null;
}

export interface RelationalBudgetYear {
    year: number;
    amount: number;
    Kuan?: RelationalBudgetItem[];
    Xiang?: RelationalBudgetItem[];
    Mu?: RelationalBudgetItem[];
    Jie?: RelationalBudgetItem[];
}
