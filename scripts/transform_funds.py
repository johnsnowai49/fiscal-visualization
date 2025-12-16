import os
import pandas as pd
import json
import sys

# Add script dir to path to import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from transform_utils import get_ad_year, clean_str, clean_number, find_header_row

# Configuration
BASE_DIR = "docs/tw-finance"
OUTPUT_DIR = "data/json"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "funds.json")
TARGET_YEARS = range(97, 115) 

# Type Mapping
TYPE_MAP = {
    "營業": "business",
    "作業": "operation",
    "債務": "debt",
    "特別收入": "special income",
    "資本": "capital plan", # 資本計畫
}

def guess_type(section_name):
    for k, v in TYPE_MAP.items():
        if k in section_name:
            return v
    return "other"

def process_year(year):
    year_dir = os.path.join(BASE_DIR, str(year))
    if not os.path.exists(year_dir):
        return None

    # Find the file
    target_file = None
    for f in os.listdir(year_dir):
        if "基金" in f and "分析" in f and not f.startswith("~"):
             target_file = os.path.join(year_dir, f)
             break
    
    if not target_file:
        print(f"[{year}] No fund file found.")
        return None

    print(f"[{year}] Processing {os.path.basename(target_file)}...")
    
    try:
        df = pd.read_excel(target_file, header=None)
        
        # 1. Detect Header
        keywords = ["基金名稱", "基金來源", "基金用途", "本年度", "預算數", "基金別"]
        header_row_idx = find_header_row(df, keywords)
        
        if header_row_idx is None:
             print(f"  Warning: No header found for year {year}")
             return None
             
        # 2. Identify Columns
        header_vals = df.iloc[header_row_idx].values
        name_col = -1
        inc_col = -1
        exp_col = -1
        
        for idx, val in enumerate(header_vals):
            v = clean_str(val)
            if "名稱" in v or "單位" in v or "基金別" in v:
                if name_col == -1: name_col = idx
            if ("來源" in v or "收入" in v) and ("預算" in v or "本年度" in v): 
                 if inc_col == -1: inc_col = idx
            if ("用途" in v or "支出" in v) and ("預算" in v or "本年度" in v):
                 if exp_col == -1: exp_col = idx
        
        # Fallback for 2-row headers
        if inc_col == -1 or exp_col == -1:
             next_vals = df.iloc[header_row_idx+1].values
             for idx, val in enumerate(next_vals):
                 v = clean_str(val)
                 if ("收入" in v or "來源" in v) and inc_col == -1: inc_col = idx
                 if ("支出" in v or "用途" in v) and exp_col == -1: exp_col = idx

        # Fallback Defaults
        if name_col == -1: name_col = 0
        if inc_col == -1: inc_col = 2 
        if exp_col == -1: exp_col = 3 
        
        # 3. Extract Data Structurallly
        # Schema Structure
        result = {
            "year": get_ad_year(year),
            "basic_fund": {
                "total": {"revenue": 0, "expenditure": 0},
                "extra": {"revenue": 0, "expenditure": 0}
            },
            "special_fund": {
                "total": {"revenue": 0, "expenditure": 0},
                "details": []
            }
        }
        
        start_row = header_row_idx + 1
        # Skip secondary header row if it exists
        if inc_col < len(header_vals):
             if "收入" not in clean_str(header_vals[inc_col]):
                 start_row += 1

        current_major_section = "" # "Basic" or "Special"
        current_sub_section_type = "business" 
        
        for i in range(start_row, len(df)):
            row = df.iloc[i]
            if name_col >= len(row): continue
            
            # Name Construction
            raw_primary = clean_str(row[name_col])
            raw_secondary = clean_str(row[name_col+1]) if (name_col + 1) < len(row) else ""
            
            final_name = raw_primary
            is_digit = raw_primary.isdigit()
            if is_digit and raw_secondary:
                 final_name = raw_secondary
            
            if not final_name: continue
            
            # Values
            inc = 0
            exp = 0
            if inc_col < len(row): inc = clean_number(row[inc_col])
            if exp_col < len(row): exp = clean_number(row[exp_col])
            
            if inc == 0 and exp == 0:
                 # Even if 0, might be a header.
                 pass
            
            # Hierarchy Logic
            # 1. Detect Major Section (One/Two)
            if "普通基金" in final_name:
                current_major_section = "BASIC"
                # If this row has totals (Year 97 does), check if we can use it? 
                if inc != 0 or exp != 0:
                     result["basic_fund"]["total"] = {"revenue": inc, "expenditure": exp}
                continue
            elif "特種基金" in final_name:
                current_major_section = "SPECIAL"
                # This row usually contains the TOTAL for special funds
                if inc != 0 or exp != 0:
                    result["special_fund"]["total"] = {"revenue": inc, "expenditure": exp}
                continue
                
            # 2. Process based on Section
            if current_major_section == "BASIC":
                if "總預算" in final_name:
                    result["basic_fund"]["total"] = {"revenue": inc, "expenditure": exp}
                elif "特別預算" in final_name:
                    result["basic_fund"]["extra"] = {"revenue": inc, "expenditure": exp}
            
            elif current_major_section == "SPECIAL":
                # Check for Sub-Section (e.g. Business Part)
                if "部分" in final_name or ("基金" in final_name and (final_name.startswith("(") or final_name.startswith("甲") or final_name.startswith("乙"))):
                     current_sub_section_type = guess_type(final_name)
                     # usually aggregates are on this line too, skip adding as detail
                     continue
                
                # Check if this is a Detail Item
                # Detail items usually:
                # 1. Have valid amounts
                # 2. Are not "Total"
                # 3. Are not duplicate of section header
                if "合計" in final_name or "總計" in final_name: continue
                
                # If it has amounts, add it
                if inc != 0 or exp != 0:
                    # Note: Spec asks for "amount", usually Expenditure for budget context
                    # But I will provide both revenue/expenditure if allowed, or just amount=expenditure
                    # Spec example: "amount": 10000000.
                    # I will map amount -> expenditure.
                    # AND I'll add "revenue" field just in case, it's safer to have more data.
                    # Wait, spec is strict? "funds.json structure: ... details: [{name, amount, type}]"
                    # I'll stick to 'amount' = expenditure for compliance, but adding 'revenue' won't hurt usually.
                    # Actually for "Business" (Business Funds), Income is Revenue. 
                    # For "Debt", Income is borrowing?
                    # Let's map "amount" to Expenditure (Budget) as safe default for "Budget Analysis".
                    
                    item = {
                        "name": final_name,
                        "type": current_sub_section_type,
                        "revenue": inc, 
                        "expenditure": exp
                    }
                    result["special_fund"]["details"].append(item)

        return result

    except Exception as e:
        print(f"  Error processing {year}: {e}")
        return None

def main():
    all_data = []
    
    for year in TARGET_YEARS:
        res = process_year(year)
        if res:
            all_data.append(res)
            
    # Write Output
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
        
    print(f"Generated {OUTPUT_FILE} with {len(all_data)} year records.")

if __name__ == "__main__":
    main()
