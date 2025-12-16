import os
import pandas as pd
import json
import sys
import re

# Add script dir to import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from transform_utils import get_ad_year, clean_str, clean_number, find_header_row

# Configuration
BASE_DIR = "docs/tw-finance"
OUTPUT_DIR = "data/json"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "revenue_by_source.json")
# Years 97 to 114
TARGET_YEARS = range(97, 115) 

def extract_code_name(val):
    """
    Separates "1. Tax Revenue" into ("1", "Tax Revenue").
    """
    s = clean_str(val)
    if not s: return "", ""
    
    # regex for "Digits. Name" or "Digits Name" or "(Digits)Name"
    match = re.match(r"^(\d+)\.?(.*)$", s)
    if match:
        return match.group(1), match.group(2).strip()
    
    return "", s

def pad_code(code, width=2):
    if not code: return "0" * width
    if code.isdigit():
        return code.zfill(width)
    return code.ljust(width, '0')[:width]

def process_year(year):
    year_dir = os.path.join(BASE_DIR, str(year))
    if not os.path.exists(year_dir):
        return None

    # Find the file
    target_file = None
    for f in os.listdir(year_dir):
        # Keyword match from spec: "歲入來源別" OR ("來源" AND "科目")
        if (("歲入" in f and "來源" in f) or ("來源" in f and "科目" in f)) and "預算" in f and not "分析" in f and not f.startswith("~"):
             target_file = os.path.join(year_dir, f)
             break
    
    if not target_file:
        print(f"[{year}] No revenue file found.")
        return None

    print(f"[{year}] Processing {os.path.basename(target_file)}...")
    
    try:
        df = pd.read_excel(target_file, header=None)
        
        # 1. Detect Header
        keywords = ["款", "項", "目", "節", "預算", "名稱", "本年度", "科目"]
        header_row_idx = find_header_row(df, keywords)
        
        if header_row_idx is None:
             print(f"  Warning: No header found for year {year}")
             return None
             
        # 2. Identify Columns
        header_vals = df.iloc[header_row_idx].values
        
        k_col = -1
        x_col = -1
        m_col = -1
        j_col = -1
        name_col = -1
        amt_col = -1
        
        for idx, val in enumerate(header_vals):
            v = clean_str(val)
            if v == "款": k_col = idx
            elif v == "項": x_col = idx
            elif v == "目": m_col = idx
            elif v == "節": j_col = idx
            elif "名稱" in v or "科目" in v: name_col = idx
            elif ("預算" in v or "本年度" in v) and amt_col == -1: amt_col = idx
        
        # Fallback Logic
        if k_col == -1: k_col = 0
        if x_col == -1: x_col = 1
        if m_col == -1: m_col = 2
        # J might be 3
        if j_col == -1 and len(header_vals) > 3: j_col = 3
        
        # Name col fallback
        if name_col == -1:
             if len(header_vals) > 4: name_col = 4
        
        if amt_col == -1:
             # Check row above header for "本年度" or "預算"
             if header_row_idx > 0:
                 prev_header_vals = df.iloc[header_row_idx - 1].values
                 for idx, val in enumerate(prev_header_vals):
                     v = clean_str(val)
                     if "本年度" in v or "預算" in v:
                         amt_col = idx
                         break
                         
        if amt_col == -1 and name_col != -1 and name_col + 1 < len(header_vals):
             # Fallback: assume column after name is amount
             amt_col = name_col + 1

        # 3. Iterate
        # V3 Structure
        kuan_list = []
        xiang_list = []
        mu_list = []
        jie_list = []
        
        # State codes
        curr_k_code = "0"
        curr_x_code = "0"
        curr_m_code = "0"
        curr_j_code = "0"
        
        # Maintain IDs for parent linkage
        curr_k_id = None
        curr_x_id = None
        curr_m_id = None
        
        start_row = header_row_idx + 1
        # Skip unit row if present
        if start_row < len(df) and "單位" in clean_str(df.iloc[start_row][0]):
            start_row += 1

        for i in range(start_row, len(df)):
            row = df.iloc[i]
            
            # Extract content from columns
            raw_k = clean_str(row[k_col]) if k_col < len(row) else ""
            raw_x = clean_str(row[x_col]) if x_col < len(row) else ""
            raw_m = clean_str(row[m_col]) if m_col < len(row) else ""
            raw_j = clean_str(row[j_col]) if j_col < len(row) else ""
            
            # Determine hierarchy level of this row
            k_c, k_n = extract_code_name(raw_k)
            x_c, x_n = extract_code_name(raw_x)
            m_c, m_n = extract_code_name(raw_m)
            j_c, j_n = extract_code_name(raw_j)
            
            # Separate Name Column?
            explicit_name = clean_str(row[name_col]) if name_col != -1 and name_col < len(row) else ""
            
            # Identify Level and Update State
            row_level = None # k, x, m, j
            name_parts = []
            
            # Logic: highest level present determines the row level
            # We must check from deepest level (Leaf) upwards to handle cases where 
            # parent columns are filled (repeated) in child rows.
            
            is_j = bool(j_c or raw_j)
            is_m = bool(m_c or raw_m)
            is_x = bool(x_c or raw_x)
            is_k = bool(k_c or raw_k)
            
            if is_j:
                curr_j_code = j_c if j_c else raw_j
                if is_m: curr_m_code = m_c if m_c else raw_m
                if is_x: curr_x_code = x_c if x_c else raw_x
                if is_k: curr_k_code = k_c if k_c else raw_k
                row_level = "j"
                if j_n: name_parts.append(j_n)
            
            elif is_m:
                curr_m_code = m_c if m_c else raw_m
                curr_j_code = "0"
                if is_x: curr_x_code = x_c if x_c else raw_x
                if is_k: curr_k_code = k_c if k_c else raw_k
                row_level = "m"
                if m_n: name_parts.append(m_n)
                
            elif is_x:
                curr_x_code = x_c if x_c else raw_x
                curr_m_code = "0"
                curr_j_code = "0"
                if is_k: curr_k_code = k_c if k_c else raw_k
                row_level = "x"
                if x_n: name_parts.append(x_n)
            
            elif is_k:
                curr_k_code = k_c if k_c else raw_k
                curr_x_code = "0"
                curr_m_code = "0"
                curr_j_code = "0"
                row_level = "k"
                if k_n: name_parts.append(k_n)
            
            if not row_level:
                # Could be a continuation or empty row
                # If explicit_name exists but no code, skip for now or treat as note?
                # transform_revenue.py ignored it if amt==0
                pass

            # Name Resolution
            final_name_str = ""
            if explicit_name:
                 # Check for combined ID+Name (e.g. "0101000000 稅課收入")
                 match_combined = re.match(r"^(\d+)\s*(.+)$", explicit_name)
                 if match_combined:
                     final_name_str = match_combined.group(2).strip()
                 else:
                     final_name_str = explicit_name
            
            if not final_name_str and name_parts:
                final_name_str = name_parts[0]
            
            # Amount
            amt = 0
            if amt_col != -1 and amt_col < len(row):
                 amt = clean_number(row[amt_col])
            
            if row_level is None:
                continue
                
            if amt == 0 and not final_name_str:
                continue
            
            # Ignore "Total" rows if they appear as Kuan but name is "合計" or "歲入合計"
            # Assuming Kuan code "0" or "00" might be total?
            # Or if name contains "合計" and it's Kuan level?
            # We want to calculate our own total or use it as the main total.
            
            is_total_row = False
            if row_level == 'k' and ("合計" in final_name_str or "總計" in final_name_str):
                is_total_row = True
                # We can capture this amount as year total?
                # But we plan to sum Kuans.
                # Let's skip it from the Kuan list to avoid double counting if we sum Kuans.
                pass

            # Build ID
            # Use 2-2-2-4 format from v1 to be safe, unless otherwise specified.
            full_id = f"{pad_code(curr_k_code, 2)}{pad_code(curr_x_code, 2)}{pad_code(curr_m_code, 2)}{pad_code(curr_j_code, 4)}"
            
            item = {
                "id": full_id,
                "name": final_name_str,
                "amount": amt,
                "parent_id": None
            }
            
            if row_level == 'k':
                if not is_total_row:
                    curr_k_id = full_id
                    item["parent_id"] = None
                    kuan_list.append(item)
            
            elif row_level == 'x':
                curr_x_id = full_id
                item["parent_id"] = curr_k_id
                xiang_list.append(item)
                
            elif row_level == 'm':
                curr_m_id = full_id
                item["parent_id"] = curr_x_id
                mu_list.append(item)
                
            elif row_level == 'j':
                item["parent_id"] = curr_m_id
                jie_list.append(item)

        # Calculate Year Total
        # Sum of all items in Kuan list
        year_total = sum(item['amount'] for item in kuan_list)

        return {
            "year": get_ad_year(year),
            "amount": year_total,
            "Kuan": kuan_list,
            "Xiang": xiang_list,
            "Mu": mu_list,
            "Jie": jie_list
        }

    except Exception as e:
        print(f"  Error processing {year}: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    final_output = []
    
    for year in TARGET_YEARS:
        res = process_year(year)
        if res:
            final_output.append(res)
            
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, ensure_ascii=False, indent=2)
        
    print(f"Generated {OUTPUT_FILE} with {len(final_output)} year records.")

if __name__ == "__main__":
    main()
