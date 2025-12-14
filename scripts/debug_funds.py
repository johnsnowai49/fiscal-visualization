import pandas as pd
import os

files = [
    "docs/tw-finance/110/110c基金別預算分析表.xls",
    "docs/tw-finance/110/110c歲入歲出簡明比較分析表.xls",
    "docs/tw-finance/114/C基金別預算分析表.xlsx",
    "docs/tw-finance/114/C歲入歲出簡明比較分析表.xlsx"
]

for f in files:
    if os.path.exists(f):
        print(f"\n--- Inspecting {f} ---")
        try:
            # Read header only
            df_head = pd.read_excel(f, nrows=10, header=None)
            print("First 10 rows (raw):")
            print(df_head.to_string())
        except Exception as e:
            print(e)
    else:
        print(f"File not found: {f}")
