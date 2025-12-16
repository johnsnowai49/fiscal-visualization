import os
import pandas as pd
import json
import re

# Configuration
BASE_DIR = os.path.abspath("docs/tw-finance")
OUTPUT_DIR = os.path.abspath("data/unified")
TARGET_YEARS = list(range(97, 115))

# Ensure output directory exists
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def get_ad_year(roc_year):
    return 1911 + int(roc_year)

def clean_str(val):
    if pd.isna(val):
        return ""
    return str(val).strip().replace('\n', '').replace('　', ' ')

def parse_amount(val):
    if pd.isna(val):
        return 0
    try:
        # Handle "15,676,552" or similar
        clean = str(val).replace(',', '').replace(' ', '')
        if clean == '-' or clean == '':
            return 0
        return int(float(clean))
    except (ValueError, TypeError):
        return 0

def find_header_row(df, keywords):
    """Finds the index of the row containing at least 2 of the keywords."""
    for i, row in df.head(15).iterrows():
        row_str = " ".join([str(x) for x in row.values])
        matches = sum(1 for k in keywords if k in row_str)
        if matches >= 2:
            return i
    return None

def find_col_index(row_values, keywords):
    """Finds column index for a keyword."""
    for idx, val in enumerate(row_values):
        val_str = clean_str(val)
        for k in keywords:
            if k in val_str:
                return idx
    return None

# --- Processors ---

def process_funds(filepath, year):
    """
    C基金別預算分析表.xlsx -> funds.json
    Schema: year, fund_name, income, expense, surplus
    """
    data = []
    try:
        df = pd.read_excel(filepath, header=None)
        
        # Heuristic: Find header row with "基金" and "名稱" or similar
        # Usually it's around row 0-5.
        # Data structure: Col 0: Name, Col 2: Income, Col 3: Expense (Approx)
        
        start_row = 0
        name_col = 0
        inc_col = 2
        exp_col = 3
        
        # Scan for headers
        header_row_idx = find_header_row(df, ["基金", "收入", "支出"])
        if header_row_idx is not None:
             # Identify columns from header row
             header_vals = df.iloc[header_row_idx].values
             
             nc = find_col_index(header_vals, ["名稱", "基金"])
             ic = find_col_index(header_vals, ["無", "包含", "收入", "基金來源"]) # 基金來源/收入
             ec = find_col_index(header_vals, ["用途", "支出", "基金用途"]) 
             
             if nc is not None: name_col = nc
             if ic is not None: inc_col = ic
             if ec is not None: exp_col = ec
             start_row = header_row_idx + 1

        for i in range(start_row, len(df)):
            row = df.iloc[i]
            name = clean_str(row[name_col])
            
            # Skip aggregates or empty
            if not name or "合計" in name or "總計" in name:
                continue
            
            # Additional check: If Col 1 (Unit) exists and is empty, it might be an aggregate header?
            # For simplicity, if it has income/expense, we take it.
            
            inc = parse_amount(row[inc_col]) if inc_col < len(row) else 0
            exp = parse_amount(row[exp_col]) if exp_col < len(row) else 0
            
            if inc == 0 and exp == 0:
                continue
                
            data.append({
                "year": get_ad_year(year),
                "fund_name": name,
                "income": inc,
                "expense": exp,
                "surplus": inc - exp
            })
            
    except Exception as e:
        print(f"Error processing Funds {filepath}: {e}")
    return data

def process_summary(filepath, year):
    """
    C歲入歲出簡明比較分析表.xlsx -> summary.json
    Schema: year, type, category, amount
    """
    data = []
    try:
        df = pd.read_excel(filepath, header=None)
        
        # Scan for header
        header_row_idx = find_header_row(df, ["項目", "預算數", "比較"])
        start_row = 0 if header_row_idx is None else header_row_idx + 1
        
        curr_type = "Revenue" # Default start
        
        for i in range(start_row, len(df)):
            row = df.iloc[i]
            name = clean_str(row[0])
            
            if not name: continue
            
            # Detect section switch
            if "歲出" in name and "合計" not in name:
                curr_type = "Expenditure"
            elif "歲入" in name and "合計" not in name:
                curr_type = "Revenue" # Reset if needed
                
            # Skip totals
            if "合計" in name or "總計" in name or "餘絀" in name:
                continue
                
            # Amount is usually Col 1
            amt = parse_amount(row[1])
            
            if amt != 0:
                data.append({
                    "year": get_ad_year(year),
                    "type": curr_type,
                    "category": name,
                    "amount": amt
                })
                
    except Exception as e:
        print(f"Error processing Summary {filepath}: {e}")
    return data

def process_hierarchy(filepath, year, json_type):
    """
    Generic hierarchical processor for:
    - revenue_by_source (K, X, M)
    - expenditure_by_agency (K, X, M, J)
    - expenditure_by_function (K, X, M)
    """
    data = []
    try:
        df = pd.read_excel(filepath, header=None)
        
        # 1. Identify Columns
        # Keywords map
        k_kw = ["款"]
        x_kw = ["項"]
        m_kw = ["目"]
        j_kw = ["節"]
        amt_kw = ["本年度預算數", "預算案數", "預算數"]
        name_kw = ["科目", "名稱"]
        
        header_row_idx = find_header_row(df, ["款", "項", "本年度預算數"])
        if header_row_idx is None:
             # Fallback: Try row 0-5
             header_row_idx = find_header_row(df, ["科目", "名稱"])
        
        start_row = 0
        if header_row_idx is not None:
            header_vals = df.iloc[header_row_idx].values
            k_idx = find_col_index(header_vals, k_kw)
            x_idx = find_col_index(header_vals, x_kw)
            m_idx = find_col_index(header_vals, m_kw)
            j_idx = find_col_index(header_vals, j_kw)
            amt_idx = find_col_index(header_vals, amt_kw)
            name_idx = find_col_index(header_vals, name_kw)
            start_row = header_row_idx + 1
        else:
             print(f"  Warning: No header found for {os.path.basename(filepath)}")
             return []

        if k_idx is None or amt_idx is None:
             print(f"  Warning: Missing K or Amt column in {os.path.basename(filepath)}")
             return []

        # State vars
        curr_k = ""
        curr_x = ""
        curr_m = ""
        curr_j = ""
        
        for i in range(start_row, len(df)):
            row = df.iloc[i]
            
            # Helper to safely get value at index
            def get_val(idx):
                if idx is not None and idx < len(row):
                    return clean_str(row[idx])
                return ""
            
            # Extract name if specific name column exists
            row_name = get_val(name_idx) if name_idx is not None else ""
            
            # Update Hierarchy
            # If a marker column has content, update state.
            
            k_val = get_val(k_idx)
            if k_val:
                curr_k = row_name if row_name else k_val
                curr_x = ""
                curr_m = ""
                curr_j = ""
            
            x_val = get_val(x_idx) if x_idx is not None else ""
            if x_val:
                curr_x = row_name if row_name else x_val
                curr_m = ""
                curr_j = ""
                
            m_val = get_val(m_idx) if m_idx is not None else ""
            if m_val:
                curr_m = row_name if row_name else m_val
                curr_j = ""
                
            j_val = get_val(j_idx) if j_idx is not None else ""
            if j_val:
                curr_j = row_name if row_name else j_val
                
            # Formatting for specific JSON Types
            amt = parse_amount(row[amt_idx]) if amt_idx < len(row) else 0
            
            if amt == 0: continue
            
            entry = {"year": get_ad_year(year), "amount": amt}
            
            if json_type == "revenue_by_source":
                # K, X, M (No J usually)
                if not curr_k: continue
                entry["top_category"] = curr_k
                entry["sub_category"] = curr_x
                entry["detail_item"] = curr_m
                
            elif json_type == "expenditure_by_agency":
                if not curr_k: continue
                entry["agency_top"] = curr_k
                entry["agency_sub"] = curr_x
                entry["program"] = curr_m
                entry["account"] = curr_j
                
            elif json_type == "expenditure_by_function":
                if not curr_k: continue
                entry["function_top"] = curr_k
                entry["function_sub"] = curr_x
                entry["program"] = curr_m
            
            data.append(entry)
            
    except Exception as e:
        print(f"Error processing Hierarchy {filepath}: {e}")
    return data


def main():
    all_funds = []
    all_summary = []
    all_rev_source = []
    all_exp_agency = []
    all_exp_func = []
    
    for year in TARGET_YEARS:
        year_dir = os.path.join(BASE_DIR, str(year))
        if not os.path.exists(year_dir):
            continue
            
        print(f"Processing Year {year}...")
        
        for filename in os.listdir(year_dir):
            if filename.startswith("~") or not (filename.endswith(".xls") or filename.endswith(".xlsx")):
                continue
            
            filepath = os.path.join(year_dir, filename)
            
            # Identify File
            # 1. Funds
            if "基金別預算分析表" in filename or "基金別" in filename:
                print(f"  Funds: {filename}")
                all_funds.extend(process_funds(filepath, year))
                
            # 2. Summary
            elif "簡明比較" in filename:
                print(f"  Summary: {filename}")
                all_summary.extend(process_summary(filepath, year))
                
            # 3. Revenue Source
            elif "歲入來源別" in filename:
                print(f"  Revenue Source: {filename}")
                all_rev_source.extend(process_hierarchy(filepath, year, "revenue_by_source"))
                
            # 4. Exp Agency
            elif "歲出機關別" in filename:
                print(f"  Exp Agency: {filename}")
                all_exp_agency.extend(process_hierarchy(filepath, year, "expenditure_by_agency"))
                
            # 5. Exp Function
            elif "歲出政事別" in filename:
                print(f"  Exp Function: {filename}")
                all_exp_func.extend(process_hierarchy(filepath, year, "expenditure_by_function"))
                
    # Save Files
    def save_json(data, filename):
        path = os.path.join(OUTPUT_DIR, filename)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Saved {filename}: {len(data)} records")

    save_json(all_funds, "funds.json")
    save_json(all_summary, "summary.json")
    save_json(all_rev_source, "revenue_by_source.json")
    save_json(all_exp_agency, "expenditure_by_agency.json")
    save_json(all_exp_func, "expenditure_by_function.json")

if __name__ == "__main__":
    main()
