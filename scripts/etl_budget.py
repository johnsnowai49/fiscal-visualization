import os
import re
import pandas as pd
from datetime import datetime

# Configuration
BASE_DIR = os.path.abspath("docs/tw-finance")
OUTPUT_DIR = os.path.abspath("data/unified")
TARGET_YEARS = list(range(97, 115))

def get_year_from_dir(dirname):
    try:
        return int(dirname)
    except ValueError:
        return None

def identify_file_type(filepath):
    """
    Identifies if it is an Expenditure, Revenue, or Analysis file.
    Priority: Content > Filename
    """
    try:
        # Read the first few rows to inspect headers (Increase to 20 to catch data)
        df_head = pd.read_excel(filepath, nrows=20, header=None)
        content_str = df_head.to_string()
        
        # Content Keywords (Headers)
        has_agency_kw = "機關" in content_str
        has_source_kw = "來源" in content_str
        has_exp_kw = "歲出" in content_str
        has_rev_kw = "歲入" in content_str
        
        # Data Keywords (Heuristic for Year 99 generic headers)
        # Exp: "總統府", "行政院", "監察院"
        has_exp_data_kw = any(k in content_str for k in ["總統府", "行政院", "立法院", "司法院", "考試院", "監察院"])
        # Rev: "稅課收入", "罰款", "規費"
        has_rev_data_kw = any(k in content_str for k in ["稅課收入", "罰款及賠償收入", "規費收入"])

        # Analysis/Summary exclusion
        if "分析表" in content_str or "分析表" in filepath:
             pass

        # 1. Strong Content Match (Explicit Header)
        if has_agency_kw and has_exp_kw: return "Expenditure"
        if has_source_kw and has_rev_kw: return "Revenue"

        # 2. Filename Fallback (For 110-114, clear names)
        filename = os.path.basename(filepath)
        if "機關別預算表" in filename: return "Expenditure"
        if "來源別預算表" in filename: return "Revenue"
        
        # 3. Weak Content/Data Match (For 99 where filename is numeric and header is generic)
        if has_exp_data_kw and "款" in content_str and "本年度預算數" in content_str:
            return "Expenditure"
        if has_rev_data_kw and "款" in content_str and "本年度預算數" in content_str:
            return "Revenue"
    except Exception as e:
        print(f"Error reading file {filepath}: {e}")
        return None

def find_column_index(df_head, keywords):
    """
    Scans the first few rows to find the column index containing any of the keywords.
    Returns: column index (int) or None
    """
    # First pass: Exact match (after cleaning)
    for row_idx, row in df_head.iterrows():
        for col_idx, val in enumerate(row):
            str_val = str(val).strip().replace('\n', '').replace(' ', '').replace('　', '')
            if str_val in keywords:
                return col_idx
                
    # Second pass: Partial match (only if strict match failed? Or strictly for longer keywords?)
    # For '款', '項' etc, we really want exact match to avoid '科目'.
    # But for '本年度預算數', we might want partial.
    
    for row_idx, row in df_head.iterrows():
        for col_idx, val in enumerate(row):
            str_val = str(val).strip().replace('\n', '').replace(' ', '').replace('　', '')
            # Only do partial match if the keyword is not a single character, 
            # OR if we are desperate. 
            # Let's filter: keywords that are len 1 MUST be exact match.
            for k in keywords:
                if len(k) == 1:
                    if k == str_val: return col_idx
                else:
                    if k in str_val: return col_idx
    return None

def find_header_row(df_head, keywords):
    """
    Finds the row index where most keywords appear.
    """
    for row_idx, row in df_head.iterrows():
        matches = sum(1 for val in row if any(k in str(val).strip() for k in keywords))
        if matches >= 2: # At least 2 matches (e.g., 款, 項)
            return row_idx
    return None

def extract_name(val):
    """
    Extracts name from 'Code\nName' format or just 'Name'.
    """
    s = str(val).strip()
    if '\n' in s:
        parts = s.split('\n')
        return parts[-1].strip()
    # Handle wide spaces?
    return s.replace('　', ' ').strip()

def process_generic(filepath, year, budget_type, keys_map):
    """
    Generic processor for both Rev and Exp.
    keys_map: {'k': ['款'], 'x': ['項'], 'm': ['目'], 'j': ['節'], 'amt': ['本年度預算數', '預算案數'], 'name': ['名稱']}
    """
    try:
        df = pd.read_excel(filepath, header=None)
        
        # Determine Header Scan Range (114 has headers at top, 110 at row 4)
        df_head = df.head(15) 
        
        # 1. Identify Column Indices
        col_indices = {}
        for key, keywords in keys_map.items():
            col_idx = find_column_index(df_head, keywords)
            col_indices[key] = col_idx
            
        # Check critical columns
        if col_indices['k'] is None or col_indices['amt'] is None:
            # print(f"Skipping {os.path.basename(filepath)}: Missing critical columns (K or Amt). Found: {col_indices}")
            return []

        # 2. Find Data Start Row (Row after the header row)
        # We need to look for a row containing typical header tokens
        header_keywords = ['款', '項', '目', '節', '代號', '名稱', '預算數']
        start_row = 0
        header_row = find_header_row(df_head, header_keywords)
        if header_row is not None:
            start_row = header_row + 1
            
        # 3. Iterate
        rows = []
        
        # State
        curr_k = ""
        curr_x = ""
        curr_m = ""
        curr_j = ""
        
        # Helper to get val
        def get_val(row, key):
            idx = col_indices.get(key)
            if idx is None: return None
            val = row[idx]
            if pd.isna(val) or str(val).strip() == "": return None
            return val

        for i in range(start_row, len(df)):
            row = df.iloc[i]
            
            # Name extraction
            raw_name = get_val(row, 'name')
            name = extract_name(raw_name) if raw_name else ""
            
            # Values
            k_val = get_val(row, 'k') 
            x_val = get_val(row, 'x')
            m_val = get_val(row, 'm')
            j_val = get_val(row, 'j')
            
            # Hierarchy Update & Reset Logic
            # Note: k_val, x_val etc are markers. If present, it means specific level is defined.
            
            if k_val: 
                curr_k = name
                curr_x = "" # Reset lower
                curr_m = ""
                curr_j = ""
            if x_val: 
                curr_x = name
                curr_m = ""
                curr_j = ""
            if m_val: 
                curr_m = name
                curr_j = ""
            if j_val: 
                curr_j = name
            
            # Amount
            amt_val = get_val(row, 'amt')
            
            val = 0
            has_amt = False
            if amt_val is not None:
                try:
                    # Handle "15,676,552" (string with commas)
                    # Handle " - " or similar
                    clean_amt = str(amt_val).replace(',', '').replace(' ', '')
                    val = float(clean_amt) # Use float then int
                    val = int(val)
                    if val != 0: has_amt = True
                except:
                    pass
            
            if has_amt:
                valid = False
                if budget_type == "Expenditure":
                    # Capture lowest level available.
                    # In 110/114, "一般行政" (Program/目) has an amount. The items under it might be breakdown.
                    # Or "一般行政" might be the sum.
                    # Let's Capture ALL rows with amount to be safe, users can filter by 'level' if we added it?
                    # Unified Schema doesn't have level.
                    # Standard practice: Include all. Dashboard needs to handle hierarchy.
                    valid = True
                else: 
                    valid = True
                
                if valid:
                     rows.append({
                        "year": 1911 + int(year),
                        "type": budget_type,
                        "category_1": curr_k,
                        "category_2": curr_x,
                        "item_name": curr_m,
                        "account_name": curr_j,
                        "amount": val,
                        "source_file": os.path.basename(filepath)
                    })

        return rows

    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return []

def process_expenditure(filepath, year):
    keys = {
        'k': ['款'], 'x': ['項'], 'm': ['目'], 'j': ['節'], 
        'amt': ['本年度預算數', '預算案數'], 
        'name': ['名稱'] # Removed '科目' to avoid matching col 0
    }
    return process_generic(filepath, year, "Expenditure", keys)

def process_revenue(filepath, year):
    keys = {
        'k': ['款'], 'x': ['項'], 'm': ['目'], 'j': ['節'], 
        'amt': ['本年度預算數', '預算案數'], 
        'name': ['名稱']
    }
    return process_generic(filepath, year, "Revenue", keys)


def process_fund(filepath, year):
    """
    Extracts Fund data.
    Schema: Fund Name, Income, Expense, Surplus
    Structure: 
    - Leaf Logic: Col 0 = Code, Col 1 = Name. Col 2 = Inc, Col 3 = Exp.
    - Aggregate Logic: Col 0 = Name, Col 1 = NaN.
    We ONLY want leaf nodes.
    """
    try:
        df = pd.read_excel(filepath, header=None)
        
        # Find header row containing '基金'
        start_row = 0
        for i, row in df.head(10).iterrows():
            if '基金' in str(row[0]) and '別' in str(row[0]): # 基金別
                start_row = i + 1
                break
        
        inc_col = 2
        exp_col = 3
        
        rows = []
        for i in range(start_row, len(df)):
            row = df.iloc[i]
            
            # Logic: If Col 1 has a name, it is a Leaf Fund. If Col 1 is NaN, it is an Aggregate (Skip).
            col0 = str(row[0]).strip()
            col1 = str(row[1]).strip() if not pd.isna(row[1]) else ""
            
            if col1:
                name = col1
            else:
                # Aggregate row or empty
                continue
                
            # Skip header repetitions if any
            if '名稱' in name or '收入' in name:
                continue
                
            inc_val = row[inc_col]
            exp_val = row[exp_col]
            
            # Parse amounts
            def parse(v):
                try: 
                    return int(float(str(v).replace(',', '').strip()))
                except: 
                    return 0
            
            inc = parse(inc_val)
            exp = parse(exp_val)
            surplus = inc - exp
            
            # Only add if it looks like data
            if inc != 0 or exp != 0:
                rows.append({
                    "year": 1911 + int(year),
                    "fund_name": name,
                    "income": inc,
                    "expense": exp,
                    "surplus": surplus,
                    "source_file": os.path.basename(filepath)
                })
        return rows
    except Exception as e:
        print(f"Error processing Fund {filepath}: {e}")
        return []

def process_summary(filepath, year):
    """
    Extracts Summary data.
    Schema: Category, Amount
    Structure: Col 0 = Category, Col 1 = Amount
    """
    try:
        df = pd.read_excel(filepath, header=None)
        
        start_row = 0
        for i, row in df.head(10).iterrows():
             # Look for '項' and '目' or '歲入合計'
             if '歲入合計' in str(row[0]):
                 start_row = i # Include this row? No, skip totals
                 break
        
        rows = []
        # We want specific keys but NOT '合計'
        # Actually start_row usually points to '一、歲入合計'. 
        # If we skip '合計', we might skip the top level.
        # User request: "problem that you included the sum value"
        # So exclude '合計'.
        
        keyword_blacklist = ["合計", "總計", "餘絀"]
        
        for i in range(start_row, len(df)):
            row = df.iloc[i]
            name = str(row[0]).strip()
            
            if pd.isna(name) or name == "": continue
            
            # Exclude sums
            if any(k in name for k in keyword_blacklist):
                continue
                
            val = row[1] # Amount matches 110/114 analysis (Col 1 is Amount)
            try:
                amt = int(float(str(val).replace(',', '').strip()))
                rows.append({
                    "year": 1911 + int(year),
                    "category": name,
                    "amount": amt,
                    "source_file": os.path.basename(filepath)
                })
            except:
                pass
                
        return rows
    except Exception as e:
        print(f"Error processing Summary {filepath}: {e}")
        return []

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    budget_data = [] # Unified Exp/Rev
    funds_data = []
    summary_data = []
    
    for year in TARGET_YEARS:
        year_dir = os.path.join(BASE_DIR, str(year))
        if not os.path.exists(year_dir):
            print(f"Directory not found for year {year}, skipping.")
            continue
            
        print(f"Processing Year {year}...")
        
        for filename in os.listdir(year_dir):
            if filename.startswith("~") or not (filename.endswith(".xls") or filename.endswith(".xlsx")):
                continue
                
            filepath = os.path.join(year_dir, filename)
            
            # Identification Logic
            
            # Read header first for content-based ID
            header_content = ""
            try:
                df_head_scan = pd.read_excel(filepath, nrows=20, header=None)
                header_content = df_head_scan.to_string()
            except:
                pass

            # 1. Check for SPECIAL files first (Fund, Summary)
            
            # Funds
            is_fund = False
            if "基金別" in filename and "分析表" in filename: 
                is_fund = True
            elif "基金別預算分析表" in header_content: 
                is_fund = True
            
            if is_fund:
                print(f"  Found Funds: {filename}")
                funds_data.extend(process_fund(filepath, year))
                continue
                
            # Summary
            is_summary = False
            if "簡明比較" in filename: 
                is_summary = True
            elif "簡明比較" in header_content or ("歲入合計" in header_content and "歲出合計" in header_content): 
                is_summary = True
                
            if is_summary:
                print(f"  Found Summary: {filename}")
                summary_data.extend(process_summary(filepath, year))
                continue
            
            # 2. Else, try to identify as Main Budget (Exp/Rev)
            file_type = identify_file_type(filepath)
            
            if file_type == "Expenditure":
                print(f"  Found Expenditure: {filename}")
                data = process_expenditure(filepath, year)
                budget_data.extend(data)
            elif file_type == "Revenue":
                print(f"  Found Revenue: {filename}")
                data = process_revenue(filepath, year)
                budget_data.extend(data)
            else:
                 # print(f"  Unknown File: {filename} | Content: {header_content[:100]}...")
                 pass

    # Save Budget All
    if budget_data:
        df_all = pd.DataFrame(budget_data)
        output_csv = os.path.join(OUTPUT_DIR, "budget_all.csv")
        df_all.to_csv(output_csv, index=False)
        print(f"Successfully generated {output_csv} with {len(df_all)} rows.")
    
    # Save Funds
    if funds_data:
        df_funds = pd.DataFrame(funds_data)
        output_csv = os.path.join(OUTPUT_DIR, "funds_all.csv")
        df_funds.to_csv(output_csv, index=False)
        print(f"Successfully generated {output_csv} with {len(df_funds)} rows.")

    # Save Summary
    if summary_data:
        df_sum = pd.DataFrame(summary_data)
        output_csv = os.path.join(OUTPUT_DIR, "summary_all.csv")
        df_sum.to_csv(output_csv, index=False)
        print(f"Successfully generated {output_csv} with {len(df_sum)} rows.")


if __name__ == "__main__":
    main()
