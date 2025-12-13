import { createContext, useContext, useState, type ReactNode } from 'react';

export type Currency = 'TWD' | 'USD';
export type Magnitude = 'raw' | 'million' | 'billion';

interface UnitState {
    currency: Currency;
    magnitude: Magnitude;
    exchangeRate: number; // 1 USD = ? TWD
    setCurrency: (c: Currency) => void;
    setMagnitude: (m: Magnitude) => void;
    formatMoney: (amountTwd: number, fractionDigits?: number) => string;
    getValue: (amountTwd: number) => number;
    getLabel: () => string;
}

const UnitContext = createContext<UnitState | undefined>(undefined);

export function UnitProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<Currency>('TWD');
    const [magnitude, setMagnitude] = useState<Magnitude>('billion'); // Default to Billion for high level
    const exchangeRate = 32.5; // Hardcoded approximation for 114

    const getValue = (amountTwd: number) => {
        let val = amountTwd;
        if (currency === 'USD') {
            val = val / exchangeRate;
        }

        if (magnitude === 'billion') val /= 1e8; // In Taiwan contexts, "Yi" is 10^8. But strictly "Billion" is 10^9. 
        // User asked for "million" or "1000 TWD" originally. 
        // Let's stick to Western Billions (10^9) or Taiwan "Yi" (10^8)? 
        // User said "1000 TWD" is the unit in data.
        // Let's assume standard Western Billion (1e9) for English UI, or maybe adjust.
        // Taiwan "Yi" (億) is 100,000,000 (10^8). This is standard for TW finance.
        // Let's use 10^8 for 'billion' (representing 億) if TWD, and 10^9 if USD?
        // To keep it simple and consistent:
        // TWD: usually 億 (10^8) or 萬 (10^4). 
        // Let's interpret 'billion' as 10^9 for generic "Billion" label, OR 10^8 for "Yi".
        // Given the data is TW government, 10^8 (Yi) is the most standard "large unit".
        // However, user asked for "Million" (10^6).
        // Let's define: 
        // Million = 10^6
        // Billion = 10^9 (Standard International)
        // But commonly in TW data visualizers, TWD is shown in 億.
        // Let's check the previous chart: I used 1e8 for "億".
        // I will add a specific "Yi" (10^8) magnitude if needed, or just map 'billion' to 1e9.
        // User specifically asked: "like TWD or USD in million".
        // Let's implement standard Million (1e6) and Billion (1e9).

        if (magnitude === 'million') val /= 1e6;
        if (magnitude === 'billion') val /= 1e9;

        return val;
    };

    const getLabel = () => {
        const symbol = currency === 'TWD' ? 'NT$' : 'US$';
        const unit = magnitude === 'billion' ? 'B' : magnitude === 'million' ? 'M' : '';
        return `${symbol} (${unit})`;
    };

    const formatMoney = (amountTwd: number, fractionDigits = 1) => {
        const val = getValue(amountTwd);
        return `${currency === 'TWD' ? 'NT$' : '$'}${val.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} ${magnitude === 'billion' ? 'B' : magnitude === 'million' ? 'M' : ''}`;
    };

    return (
        <UnitContext.Provider value={{
            currency,
            magnitude,
            exchangeRate,
            setCurrency,
            setMagnitude,
            formatMoney,
            getValue,
            getLabel
        }}>
            {children}
        </UnitContext.Provider>
    );
}

export function useUnit() {
    const context = useContext(UnitContext);
    if (context === undefined) {
        throw new Error('useUnit must be used within a UnitProvider');
    }
    return context;
}
