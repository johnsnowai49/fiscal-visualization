import pandas as pd
import glob
import os

data_dir = "~/projects/finance-platform/docs/tw-finance/114"
data_dir = os.path.expanduser(data_dir)
xlsx_files = glob.glob(os.path.join(data_dir, "*.xlsx"))
print("xlsx_files:", xlsx_files)
for file_path in xlsx_files:
    print(f"\n{'='*80}")
    print(f"File: {os.path.basename(file_path)}")
    print(f"{'='*80}")
    
    try:
        # Load the Excel file
        xls = pd.ExcelFile(file_path)
        print(f"Sheet Names: {xls.sheet_names}")
        
        for sheet_name in xls.sheet_names:
            print(f"\n  --- Sheet: {sheet_name} ---")
            df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=5)
            print(f"  Columns: {df.columns.tolist()}")
            print(f"  First 3 rows:")
            print(df.head(3).to_string())
            print("\n")
            
    except Exception as e:
        print(f"ERROR reading {file_path}: {e}")
