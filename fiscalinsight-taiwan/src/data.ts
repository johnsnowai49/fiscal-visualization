import { OverviewData, FundYearData, BudgetDetailData } from './types';
import rawOverview from './data/json/summary.json';
import rawFunds from './data/json/funds.json';
import rawDetails from './data/billion/budget_detail.json';

export const OVERVIEW_DATA: OverviewData[] = rawOverview as OverviewData[];
export const FUNDS_DATA: FundYearData[] = rawFunds as FundYearData[];
export const BUDGET_DETAIL_DATA: BudgetDetailData[] = rawDetails as BudgetDetailData[];
