import pandas as pd
import re

def get_ad_year(roc_year):
    """Convert ROC year to AD year."""
    try:
        return int(roc_year) + 1911
    except:
        return 0

def clean_str(val):
    """Clean string values."""
    if pd.isna(val):
        return ""
    # Remove newlines, tabs, wide spaces, and trim
    return str(val).strip().replace('\n', '').replace('　', '').replace(' ', '')

def clean_number(val):
    """
    Parse a number from string or float.
    Handles '1,234', ' - ', ' ', etc.
    Returns 0 if invalid.
    """
    if pd.isna(val):
        return 0
    s = str(val).strip().replace(',', '').replace(' ', '')
    if s in ['-', '', 'nan', 'None']:
        return 0
    try:
        f = float(s)
        return int(f)
    except ValueError:
        return 0

def find_header_row(df, keywords, max_scan=20):
    """
    Find the index of the first row containing at least 2 of the keywords.
    Scans the first `max_scan` rows.
    """
    for i, row in df.head(max_scan).iterrows():
        row_str = " ".join([str(x) for x in row.values])
        matches = sum(1 for k in keywords if k in row_str)
        if matches >= 1: # Lower threshold to 1 if keywords are distinct enough
             # But usually for reliability we want more?
             # For Summary: "歲入", "歲出", "比較" -> distinct enough.
             if matches >= 2:
                 return i
    
    # Fallback: scan strict match in cleaned values
    for i, row in df.head(max_scan).iterrows():
        cleaned_vals = [clean_str(x) for x in row.values]
        row_clean = "".join(cleaned_vals)
        matches = sum(1 for k in keywords if k in row_clean)
        if matches >= 2:
            return i
            
    return None
