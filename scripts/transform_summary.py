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
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "summary.json")
TARGET_YEARS = range(97, 115) # 97 to 114

# Category Mappings (Hardcoded for stability as names are consistent)
# Map: Keyword -> (Type, Standard Name)
CATEGORY_MAP = {
    # Revenue
    "稅課": ("revenue", "稅課收入"),
    "營業盈餘": ("revenue", "營業盈餘及事業收入"),
    "規費": ("revenue", "規費及罰款收入"),
    "財產收入": ("revenue", "財產收入"),
    "其他收入": ("revenue", "其他收入"),
    # Expenditure
    "政務支出": ("expenditure", "一般政務支出"),
    "國防支出": ("expenditure", "國防支出"),
    "教育科學": ("expenditure", "教育科學文化支出"),
    "經濟發展": ("expenditure", "經濟發展支出"),
    "社會福利": ("expenditure", "社會福利支出"),
    "社區發展": ("expenditure", "社區發展及環境保護支出"),
    "退休撫卹": ("expenditure", "退休撫卹支出"),
    "債務支出": ("expenditure", "債務支出"),
    "補助及其他": ("expenditure", "補助及其他支出")
}

def process_year(year):
    year_dir = os.path.join(BASE_DIR, str(year))
    if not os.path.exists(year_dir):
        return None

    # Find the summary file
    target_file = None
    for f in os.listdir(year_dir):
        if "歲入歲出簡明比較" in f and (f.endswith(".xls") or f.endswith(".xlsx")) and not f.startswith("~"):
            target_file = os.path.join(year_dir, f)
            break
    
    if not target_file:
        print(f"[{year}] No summary file found.")
        return None

    print(f"[{year}] Processing {os.path.basename(target_file)}...")
    
    try:
        df = pd.read_excel(target_file, header=None)
        
        # 1. Detect Header
        # Look for "項目" and "預算數" (or similar)
        header_keywords = ["項目", "科目", "預算數", "本年度"]
        header_row_idx = find_header_row(df, header_keywords)
        
        if header_row_idx is None:
            print(f"  Warning: No header found for year {year}")
            return None
            
        start_row = header_row_idx + 1
        
        # 2. Identify Columns
        # Usually Col 0 is Name, Col 1 (or 2) is Amount
        # Let's inspect the header row to be sure
        header_vals = df.iloc[header_row_idx].values
        name_col = -1
        amt_col = -1
        
        for idx, val in enumerate(header_vals):
            v = clean_str(val)
            if "項目" in v or "科目" in v:
                name_col = idx
            if "預算數" in v or "預算案數" in v or "本年度" in v:
                if amt_col == -1: amt_col = idx # Take first match
        
        # Fallback if detection fails (common structure)
        if name_col == -1: name_col = 0
        if amt_col == -1: amt_col = 1
        
        # 3. Extract Data
        year_data = {
            "year": get_ad_year(year),
            "revenue": 0,
            "expenditure": 0,
            "revenue_categories": [],
            "expenditure_categories": []
        }
        
        for i in range(start_row, len(df)):
            row = df.iloc[i]
            if name_col >= len(row) or amt_col >= len(row): continue
            
            raw_name = clean_str(row[name_col])
            raw_amt = row[amt_col]
            amount = clean_number(raw_amt)
            
            if not raw_name: continue
            
            # Identify high level totals
            if "歲入合計" in raw_name:
                year_data["revenue"] = amount
            elif "歲出合計" in raw_name:
                year_data["expenditure"] = amount
            
            # Map Categories
            matched = False
            for kw, (cat_type, std_name) in CATEGORY_MAP.items():
                if kw in raw_name:
                    target_list = year_data["revenue_categories"] if cat_type == "revenue" else year_data["expenditure_categories"]
                    # Check if already added (some files duplicate rows or have subtotals)
                    if not any(d['name'] == std_name for d in target_list):
                        target_list.append({
                            "name": std_name,
                            "amount": amount
                        })
                    matched = True
                    break
            
        return year_data

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
        
    print(f"Generated {OUTPUT_FILE} with {len(all_data)} records.")

if __name__ == "__main__":
    main()
