import Papa from 'papaparse';
import type { AppData, BudgetRow, FundRow, SummaryRow } from '../types/budget';

const BASE_PATH = '/data/unified';

export async function loadAllData(): Promise<AppData> {
    const [budgets, funds, summaries] = await Promise.all([
        fetchCsv<BudgetRow>(`${BASE_PATH}/budget_all.csv`),
        fetchCsv<FundRow>(`${BASE_PATH}/funds_all.csv`),
        fetchCsv<SummaryRow>(`${BASE_PATH}/summary_all.csv`),
    ]);

    return { budgets, funds, summaries };
}

function fetchCsv<T>(url: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length) {
                    console.warn(`CSV Parse Warnings for ${url}:`, results.errors);
                }
                resolve(results.data as T[]);
            },
            error: (error) => {
                reject(error);
            },
        });
    });
}
