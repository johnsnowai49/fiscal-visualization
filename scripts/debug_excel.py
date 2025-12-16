import pandas as pd
import sys

def inspect(filepath):
    print(f"Inspecting: {filepath}")
    try:
        df = pd.read_excel(filepath, header=None, nrows=20)
        print(df.to_string())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        inspect(sys.argv[1])
    else:
        print("Usage: python debug_excel.py <filepath>")
