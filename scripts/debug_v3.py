import os
import pandas as pd
import sys
import re

# Add script dir to import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from transform_utils import clean_str, find_header_row

BASE_DIR = "docs/tw-finance"
YEAR = 97

def debug_year(year):
    year_dir = os.path.join(BASE_DIR, str(year))
    target_file = None
    for f in os.listdir(year_dir):
        if (("歲入" in f and "來源" in f) or ("來源" in f and "科目" in f)) and "預算" in f and not "分析" in f:
             target_file = os.path.join(year_dir, f)
             break
    
    if not target_file:
        print("File not found")
        return

    print(f"File: {target_file}")
    df = pd.read_excel(target_file, header=None)
    
    keywords = ["款", "項", "目", "節", "預算", "名稱", "本年度", "科目"]
    header_idx = find_header_row(df, keywords)
    print(f"Header Index: {header_idx}")
    
    if header_idx is not None:
        header_vals = df.iloc[header_idx].values
        print(f"Header Row: {header_vals}")
        
        for idx, val in enumerate(header_vals):
            print(f"{idx}: {clean_str(val)}")
        
        # Check first 5 rows of data
        print("--- Data Sample ---")
        start = header_idx + 1
        for i in range(start, start + 10):
            row = df.iloc[i]
            print(f"Row {i}: {[clean_str(x) for x in row]}")

debug_year(YEAR)
