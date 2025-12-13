import { FiscalYearData, Period } from './types';

// Helper to generate simulated data with some narrative logic
// P1: Stable, balanced.
// P2: High infrastructure spending, increased debt.
// P3: Social welfare focus, higher taxes.

const generateFunds = (period: Period, rev: number, exp: number) => {
  let generalRevShare = 0.7;
  let specialRevShare = 0.1; 
  let socialRevShare = 0.2;

  let generalExpShare = 0.65;
  let specialExpShare = 0.15;
  let socialExpShare = 0.2;

  if (period === Period.P2) {
    // High Infra -> Special Fund usage increases
    specialExpShare = 0.35;
    generalExpShare = 0.50;
    socialExpShare = 0.15;
    // Debt primarily flows into Special Fund
    specialRevShare = 0.25;
    generalRevShare = 0.60;
    socialRevShare = 0.15;
  } else if (period === Period.P3) {
    // High Social
    socialExpShare = 0.35;
    generalExpShare = 0.55;
    specialExpShare = 0.10;
    
    socialRevShare = 0.30;
    generalRevShare = 0.60;
    specialRevShare = 0.10;
  }

  return [
    { name: 'General Fund', income: Math.round(rev * generalRevShare), expense: Math.round(exp * generalExpShare) },
    { name: 'Special Infrastructure Fund', income: Math.round(rev * specialRevShare), expense: Math.round(exp * specialExpShare) },
    { name: 'Social Security Fund', income: Math.round(rev * socialRevShare), expense: Math.round(exp * socialExpShare) },
  ];
};

export const FISCAL_DATA: FiscalYearData[] = [
  // Period 1
  {
    year: 1,
    period: Period.P1,
    totalRevenue: 2000,
    totalExpenditure: 1950,
    revenue: { tax: 1500, fees: 300, debt: 100, other: 100 },
    expenditure: { education: 400, defense: 300, socialWelfare: 500, infrastructure: 400, administration: 350 },
    funds: [], // Filled below
  },
  {
    year: 2,
    period: Period.P1,
    totalRevenue: 2050,
    totalExpenditure: 2000,
    revenue: { tax: 1550, fees: 310, debt: 90, other: 100 },
    expenditure: { education: 410, defense: 310, socialWelfare: 510, infrastructure: 410, administration: 360 },
    funds: [],
  },
  {
    year: 3,
    period: Period.P1,
    totalRevenue: 2100,
    totalExpenditure: 2100,
    revenue: { tax: 1600, fees: 320, debt: 80, other: 100 },
    expenditure: { education: 420, defense: 320, socialWelfare: 520, infrastructure: 420, administration: 420 },
    funds: [],
  },
  {
    year: 4,
    period: Period.P1,
    totalRevenue: 2150,
    totalExpenditure: 2180,
    revenue: { tax: 1650, fees: 330, debt: 70, other: 100 },
    expenditure: { education: 430, defense: 330, socialWelfare: 530, infrastructure: 430, administration: 460 },
    funds: [],
  },
  // Period 2 (High Infra, High Debt)
  {
    year: 5,
    period: Period.P2,
    totalRevenue: 2300,
    totalExpenditure: 2500,
    revenue: { tax: 1700, fees: 300, debt: 250, other: 50 },
    expenditure: { education: 450, defense: 350, socialWelfare: 550, infrastructure: 800, administration: 350 },
    funds: [],
  },
  {
    year: 6,
    period: Period.P2,
    totalRevenue: 2350,
    totalExpenditure: 2600,
    revenue: { tax: 1750, fees: 300, debt: 250, other: 50 },
    expenditure: { education: 460, defense: 360, socialWelfare: 560, infrastructure: 850, administration: 370 },
    funds: [],
  },
  {
    year: 7,
    period: Period.P2,
    totalRevenue: 2400,
    totalExpenditure: 2700,
    revenue: { tax: 1800, fees: 310, debt: 240, other: 50 },
    expenditure: { education: 470, defense: 370, socialWelfare: 570, infrastructure: 900, administration: 390 },
    funds: [],
  },
  {
    year: 8,
    period: Period.P2,
    totalRevenue: 2450,
    totalExpenditure: 2750,
    revenue: { tax: 1850, fees: 320, debt: 230, other: 50 },
    expenditure: { education: 480, defense: 380, socialWelfare: 580, infrastructure: 920, administration: 390 },
    funds: [],
  },
  // Period 3 (Austerity on Infra, High Social, High Tax)
  {
    year: 9,
    period: Period.P3,
    totalRevenue: 2800,
    totalExpenditure: 2600,
    revenue: { tax: 2200, fees: 400, debt: 100, other: 100 },
    expenditure: { education: 600, defense: 400, socialWelfare: 900, infrastructure: 400, administration: 300 },
    funds: [],
  },
  {
    year: 10,
    period: Period.P3,
    totalRevenue: 2900,
    totalExpenditure: 2700,
    revenue: { tax: 2300, fees: 410, debt: 90, other: 100 },
    expenditure: { education: 620, defense: 410, socialWelfare: 950, infrastructure: 410, administration: 310 },
    funds: [],
  },
  {
    year: 11,
    period: Period.P3,
    totalRevenue: 3000,
    totalExpenditure: 2800,
    revenue: { tax: 2400, fees: 420, debt: 80, other: 100 },
    expenditure: { education: 640, defense: 420, socialWelfare: 1000, infrastructure: 420, administration: 320 },
    funds: [],
  },
  {
    year: 12,
    period: Period.P3,
    totalRevenue: 3100,
    totalExpenditure: 2900,
    revenue: { tax: 2500, fees: 430, debt: 70, other: 100 },
    expenditure: { education: 660, defense: 430, socialWelfare: 1050, infrastructure: 430, administration: 330 },
    funds: [],
  },
].map(item => ({
  ...item,
  funds: generateFunds(item.period, item.totalRevenue, item.totalExpenditure)
}));
