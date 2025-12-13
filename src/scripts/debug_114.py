import pandas as pd
import os

files = [
    "docs/tw-finance/114/C歲出機關別預算表.xlsx",
    "docs/tw-finance/114/C歲入來源別預算表.xlsx"
]

for f in files:
    print(f"\n--- Inspecting {f} ---")
    try:
        # Read header only
        df_head = pd.read_excel(f, nrows=10, header=None)
        print("First 10 rows (raw):")
        print(df_head.to_string())
    except Exception as e:
        print(e)
