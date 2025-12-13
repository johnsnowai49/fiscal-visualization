export interface BudgetRow {
    year: number;
    type: 'Revenue' | 'Expenditure';
    category_1: string;
    category_2: string;
    item_name: string;
    account_name: string;
    amount: number;
    source_file: string;
}

export interface FundRow {
    year: number;
    fund_name: string;
    income: number;
    expense: number;
    surplus: number;
    source_file: string;
}

export interface SummaryRow {
    year: number;
    category: string;
    amount: number;
    source_file: string;
}

export interface AppData {
    budgets: BudgetRow[];
    funds: FundRow[];
    summaries: SummaryRow[];
}
