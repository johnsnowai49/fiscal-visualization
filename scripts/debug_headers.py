import pandas as pd
import os

files_to_check = [
    "docs/tw-finance/114/C歲出機關別預算表.xlsx",
    "docs/tw-finance/108/108c歲入來源別預算表.xls"
]

for f in files_to_check:
    print(f"--- Checking {f} ---")
    try:
        df = pd.read_excel(f, header=None, nrows=10)
        print(df.to_string())
    except Exception as e:
        print(e)
