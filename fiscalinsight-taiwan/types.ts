export enum Period {
  P1 = 'Period 1 (Y1-Y4)',
  P2 = 'Period 2 (Y5-Y8)',
  P3 = 'Period 3 (Y9-Y12)',
}

export interface RevenueBreakdown {
  tax: number;
  fees: number;
  debt: number;
  other: number;
}

export interface ExpenditureBreakdown {
  education: number;
  defense: number;
  socialWelfare: number;
  infrastructure: number;
  administration: number;
}

export interface FundItem {
  name: string;
  income: number;
  expense: number;
}

export interface FiscalYearData {
  year: number;
  period: Period;
  totalRevenue: number;
  totalExpenditure: number;
  revenue: RevenueBreakdown;
  expenditure: ExpenditureBreakdown;
  funds: FundItem[];
}
