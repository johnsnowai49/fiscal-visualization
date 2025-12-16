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
    Find the index of the row with the MOST keyword matches.
    Scans the first `max_scan` rows using CLEANED values to handle spaces.
    e.g. "名 稱" -> "名稱".
    """
    best_row = None
    max_matches = 0
    threshold = 2
    
    for i, row in df.head(max_scan).iterrows():
        # Use cleaned values for robust matching
        cleaned_vals = [clean_str(x) for x in row.values]
        row_clean = "".join(cleaned_vals)
        
        matches = sum(1 for k in keywords if k in row_clean)
        
        # Strictly greater to prefer earlier rows in case of ties?
        # Or >= to prefer later? Usually header is lower down if duplicate.
        # But here Row 3 vs Row 4. We want Row 4 (5 matches) over Row 3 (4 matches).
        if matches >= threshold and matches >= max_matches:
            max_matches = matches
            best_row = i
            
    return best_row

