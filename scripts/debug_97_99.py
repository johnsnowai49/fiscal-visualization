import pandas as pd
import os

BASE_DIR = "docs/tw-finance"
YEARS = [97, 98, 99]

for year in YEARS:
    year_dir = os.path.join(BASE_DIR, str(year))
    if not os.path.exists(year_dir): continue
    
    print(f"\n=== Inspecting Year {year} ===")
    for f in os.listdir(year_dir):
        if not f.endswith(".xls"): continue
        filepath = os.path.join(year_dir, f)
        
        try:
            print(f"\nFile: {f}")
            df = pd.read_excel(filepath, header=None, nrows=5)
            print(df.to_string())
        except Exception as e:
            print(f"Error: {e}")
