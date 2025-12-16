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
TARGET_YEARS = range(97, 115) 

def extract_code_name(val):
    """
    Separates "1. Tax Revenue" into ("1", "Tax Revenue").
    Or "1" -> ("1", "").
    Or "Tax" -> ("", "Tax").
    """
    s = clean_str(val)
    if not s: return "", ""
    
    # regex for "Digits. Name" or "Digits Name" or "(Digits)Name"
    # standard: "1", "1.xxx", "01"
    match = re.match(r"^(\d+)\.?(.*)$", s)
    if match:
        return match.group(1), match.group(2).strip()
    
    # Check for Chinese numbers? usually standard validation uses digits.
    # If no digits at start, maybe it is just name.
    # But check if the column itself is a code column.
    
    return "", s

def pad_code(code, width=2):
    if not code: return "0" * width
    # If code is numeric, pad it.
    if code.isdigit():
        return code.zfill(width)
    return code.ljust(width, '0')[:width] # fallback?

def process_year(year):
    year_dir = os.path.join(BASE_DIR, str(year))
    if not os.path.exists(year_dir):
        return None

    # Find the file
    target_file = None
    for f in os.listdir(year_dir):
        if "歲入" in f and "來源" in f and "預算" in f and not "分析" in f and not f.startswith("~"):
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
             # Try 4 (after J)
             if len(header_vals) > 4: name_col = 4
        
        if amt_col == -1:
             # Try last column?
             pass

        # 3. Iterate
        items = []
        
        # State codes
        curr_k_code = "0"
        curr_x_code = "0"
        curr_m_code = "0"
        curr_j_code = "0"
        
        start_row = header_row_idx + 1
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
            # If K is present, it's a K row (or resetting K)
            # Logic: If raw_k has value, this row defines K.
            
            # Extract Code and Name from the markers itself (older files) OR separately?
            # 110+ files: K col = "1", Name col = "Tax".
            # 97 files: K col = "1. Tax", Name col = ?
            
            # Let's try raw fields first.
            k_c, k_n = extract_code_name(raw_k)
            x_c, x_n = extract_code_name(raw_x)
            m_c, m_n = extract_code_name(raw_m)
            j_c, j_n = extract_code_name(raw_j)
            
            # Separate Name Column?
            explicit_name = clean_str(row[name_col]) if name_col != -1 and name_col < len(row) else ""
            
            # Update Hierarchy State
            # Only update if a NEW code is presented.
            
            row_level = ""
            name_parts = []
            
            if k_c or (raw_k and not x_c and not m_c and not j_c):
                curr_k_code = k_c if k_c else raw_k # Fallback if regex failed but content exists
                curr_x_code = "0"
                curr_m_code = "0"
                curr_j_code = "0"
                row_level = "k"
                if k_n: name_parts.append(k_n)
            
            if x_c or (raw_x and not m_c and not j_c):
                curr_x_code = x_c if x_c else raw_x
                curr_m_code = "0"
                curr_j_code = "0"
                row_level = "x"
                if x_n: name_parts.append(x_n)
                
            if m_c or (raw_m and not j_c):
                curr_m_code = m_c if m_c else raw_m
                curr_j_code = "0"
                row_level = "m"
                if m_n: name_parts.append(m_n)
            
            if j_c or raw_j:
                curr_j_code = j_c if j_c else raw_j
                row_level = "j"
                if j_n: name_parts.append(j_n)

            # Name Resolution
            # If explicit name exists, prioritize it.
            # If not, use the name extracted from code column.
            final_name_str = ""
            
            if explicit_name:
                 # Check for combined ID+Name (e.g. "0101000000 稅課收入")
                 # Often seen in newer formats
                 match_combined = re.match(r"^(\d+)\s*(.+)$", explicit_name)
                 if match_combined:
                     final_name_str = match_combined.group(2).strip()
                 else:
                     final_name_str = explicit_name
            
            if not final_name_str and name_parts:
                final_name_str = name_parts[0] # The one from the current level
            
            # Amount
            amt = 0
            if amt_col != -1 and amt_col < len(row):
                 amt = clean_number(row[amt_col])
            
            if amt == 0 and not final_name_str:
                continue
            
            # Build ID
            # Pad K=2, X=2, M=2, J=4? Spec ID "0100000000" (Total 10).
            # If 2+2+2+4 = 10.
            # Let's assume J is 2 chars if padded?
            # 01 00 00 00 00 -> 10 chars.
            # 2 chars each level seems standard.
            # If J is 2 chars, then 8 chars total?
            # Spec "0100000000" has 10 chars.
            # Maybe J is 4 chars? Or maybe there's a 5th level?
            # Or maybe K=3?
            # Let's check typical codes. "1" -> "01".
            # 2+2+2+4 = 10 seems plausible for "Jie" which can be detailed.
            
            full_id = f"{pad_code(curr_k_code, 2)}{pad_code(curr_x_code, 2)}{pad_code(curr_m_code, 2)}{pad_code(curr_j_code, 4)}"
            
            # Hierarchy Array (Integer codes)
            # Spec: [1, 0, 0, 0]
            def to_int(c):
                try: return int(c)
                except: return 0 # If "甲", return 0?
            
            hierarchy = [to_int(curr_k_code), to_int(curr_x_code), to_int(curr_m_code), to_int(curr_j_code)]
            
            items.append({
                "id": full_id,
                "year": get_ad_year(year),
                "name": [final_name_str],
                "amount": amt,
                "hierarchy": hierarchy
            })

        return {
            "year": get_ad_year(year),
            "items": items
        }

    except Exception as e:
        print(f"  Error processing {year}: {e}")
        return None

def main():
    all_data = [] # Flattened list of all items across years? 
    # Spec example lists items "[ { ... } ]". top level is list.
    # User might want a FLAT list of all rows across all years?
    # Or grouped by year?
    # Spec example: [ { "year": 2025 }, ... ]
    # This implies a flat list of objects, each having a year property.
    
    final_output = []
    
    for year in TARGET_YEARS:
        res = process_year(year)
        if res:
            final_output.extend(res["items"]) # Flatten items from all years into one list
            
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, ensure_ascii=False, indent=2)
        
    print(f"Generated {OUTPUT_FILE} with {len(final_output)} total records.")

if __name__ == "__main__":
    main()
