import { OverviewData, FundYearData, BudgetDetailData } from './types';
import rawOverview from './src/data/billion/overview.json';
import rawFunds from './src/data/billion/funds.json';
import rawDetails from './src/data/billion/budget_detail.json';

export const OVERVIEW_DATA: OverviewData[] = rawOverview as OverviewData[];
export const FUNDS_DATA: FundYearData[] = rawFunds as FundYearData[];
export const BUDGET_DETAIL_DATA: BudgetDetailData[] = rawDetails as BudgetDetailData[];
