import csv
import json
import os

# Config
DATA_DIR = "fiscalinsight-taiwan/data/unified"
OUTPUT_FILE = "fiscalinsight-taiwan/src/data/fiscal_data.json"

def read_csv(filepath):
    data = []
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return []
        
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    return data


def scale(val):
    # CSV Unit is likely Thousands. We want Billions.
    # Value * 1000 = Raw TWD.
    # Raw TWD / 1,000,000,000 = Billions.
    # So Value / 1,000,000 = Billions.
    try:
        if not val: return 0
        v = float(val)
        return int(v / 1000000)
    except:
        return 0

def main():
    print("Loading data...")
    summary_data = read_csv(os.path.join(DATA_DIR, "summary_all.csv"))
    funds_data = read_csv(os.path.join(DATA_DIR, "funds_all.csv"))
    
    if not summary_data:
        print("No summary data found.")
        return

    # Extract unique years
    years = sorted(list(set(int(row['year']) for row in summary_data)))
    
    fiscal_data = []

    for year in years:
        # Filter for current year
        sum_rows = [row for row in summary_data if int(row['year']) == year]
        fund_rows = [row for row in funds_data if int(row['year']) == year]

        # --- Revenue Calculation ---
        rev_tax = 0
        rev_fees = 0
        rev_debt = 0
        total_rev = 0
        
        # Categories mapping
        # 1. Tax
        # 2. Fees
        # 3. Debt (if any)
        
        # Helper to check keywords
        def has_kw(text, keywords):
            return any(k in text for k in keywords)

        for row in sum_rows:
            cat = row['category']
            amt = scale(row['amount'])
            
            # Identify Revenue Rows (Exclude '支出')
            if '支出' not in cat:
                total_rev += amt
                if has_kw(cat, ['稅']):
                    rev_tax += amt
                elif has_kw(cat, ['規費', '罰款']):
                    rev_fees += amt
                elif has_kw(cat, ['公債', '借款', '債務']):
                    rev_debt += amt
        
        rev_other = total_rev - (rev_tax + rev_fees + rev_debt)

        # --- Expenditure Calculation ---
        exp_edu = 0
        exp_def = 0
        exp_social = 0
        exp_infra = 0
        exp_admin = 0
        total_exp = 0
        
        exp_mapped_sum = 0 # To track what we've assigned

        for row in sum_rows:
            cat = row['category']
            amt = scale(row['amount'])
            
            # Identify Expenditure Rows
            if '支出' in cat:
                total_exp += amt
                
                # Assign to buckets
                assigned = False
                if has_kw(cat, ['教育']):
                    exp_edu += amt
                    assigned = True
                elif has_kw(cat, ['國防']):
                    exp_def += amt
                    assigned = True
                elif has_kw(cat, ['社會福利', '退休']):
                    exp_social += amt
                    assigned = True
                elif has_kw(cat, ['經濟發展', '社區發展']):
                    exp_infra += amt
                    assigned = True
                elif has_kw(cat, ['一般政務']):
                    exp_admin += amt
                    assigned = True
                
                if assigned:
                    exp_mapped_sum += amt

        # Gap logic: put rest in Admin or Other.
        # Let's add the gap to 'administration' as per plan
        gap = total_exp - exp_mapped_sum
        exp_admin += gap

        # --- Funds ---
        funds_list = []
        for row in fund_rows:
            funds_list.append({
                "name": row['fund_name'],
                "income": scale(row['income']),
                "expense": scale(row['expense'])
            })

        # --- Period ---
        if year < 2016:
            period = "2008-2016"
        elif year < 2024:
            period = "2016-2024"
        else:
            period = "2024-"

        fiscal_data.append({
            "year": year,
            "period": period,
            "totalRevenue": total_rev,
            "totalExpenditure": total_exp,
            "revenue": {
                "tax": rev_tax,
                "fees": rev_fees,
                "debt": rev_debt,
                "other": rev_other
            },
            "expenditure": {
                "education": exp_edu,
                "defense": exp_def,
                "socialWelfare": exp_social,
                "infrastructure": exp_infra,
                "administration": exp_admin
            },
            "funds": funds_list
        })

    # Save
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(fiscal_data, f, ensure_ascii=False, indent=2)
        
    print(f"Done! Generated {OUTPUT_FILE} with {len(fiscal_data)} years.")

if __name__ == "__main__":
    main()
