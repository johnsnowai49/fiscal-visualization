import csv
import json
import os

# Config
DATA_DIR = "data/unified"
OUTPUT_DIR = "fiscalinsight-taiwan/src/data"
MAP_FILE = "docs/specs/category_map.json"

def read_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return []

def read_csv(filepath):
    data = []
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    return data

def scale_billions(val):
    try:
        if not val: return 0.0
        return round(float(val) / 1000000, 2)
    except:
        return 0.0

def parse_int(val):
    try:
        if not val: return 0
        return int(float(str(val).replace(',', '').strip()))
    except:
        return 0

def get_category_id(zh_name, category_map):
    for item in category_map:
        for keyword in item['zh']:
            if keyword in zh_name:
                return item['id'], item['en'], item['type'], item.get('abbr', '')
    return None, None, None, None

def generate_overview_split(summary_rows, category_map):
    years = sorted(list(set(int(row['year']) for row in summary_rows)))
    
    raw_list = []
    billion_list = []

    for year in years:
        rows = [r for r in summary_rows if int(r['year']) == year]
        
        # Structure for this year
        entry_raw = { "year": year, "revenue": {"total": 0, "breakdown": {}}, "expenditure": {"total": 0, "breakdown": {}}}
        entry_bil = { "year": year, "revenue": {"total": 0.0, "breakdown": {}}, "expenditure": {"total": 0.0, "breakdown": {}}}
        
        # Init breakdown
        for mapping in category_map:
            t = mapping['type']
            entry_raw[t]['breakdown'][mapping['id']] = { "name": mapping['en'], "abbr": mapping['abbr'], "amount": 0 }
            entry_bil[t]['breakdown'][mapping['id']] = { "name": mapping['en'], "abbr": mapping['abbr'], "amount": 0.0 }

        # Accumulate Raw
        for row in rows:
            cat_name = row['category']
            raw_amt = parse_int(row['amount'])
            
            # Map
            mapped_id = None
            mapped_type = None
            
            for m in category_map:
                if any(kw in cat_name for kw in m['zh']):
                    mapped_id = m['id']
                    mapped_type = m['type']
                    break
            
            if mapped_id:
                entry_raw[mapped_type]['breakdown'][mapped_id]['amount'] += raw_amt
                entry_raw[mapped_type]['total'] += raw_amt
        
        # Populate Billions from Raw
        def fill_billion(section_raw, section_bil):
            section_bil['total'] = scale_billions(section_raw['total'])
            for k, v in section_raw['breakdown'].items():
                section_bil['breakdown'][k]['amount'] = scale_billions(v['amount'])

        fill_billion(entry_raw['revenue'], entry_bil['revenue'])
        fill_billion(entry_raw['expenditure'], entry_bil['expenditure'])
        
        raw_list.append(entry_raw)
        billion_list.append(entry_bil)

    return raw_list, billion_list

def generate_funds_split(fund_rows):
    years = sorted(list(set(int(row['year']) for row in fund_rows)))
    raw_list = []
    billion_list = []
    
    for year in years:
        rows = [r for r in fund_rows if int(r['year']) == year]
        items_raw = []
        items_bil = []

        for r in rows:
            inc = parse_int(r['income'])
            exp = parse_int(r['expense'])
            
            items_raw.append({ "name": r['fund_name'], "income": inc, "expense": exp })
            items_bil.append({ "name": r['fund_name'], "income": scale_billions(inc), "expense": scale_billions(exp) })
        
        # Sort by Income Desc
        items_raw.sort(key=lambda x: x['income'], reverse=True)
        items_bil.sort(key=lambda x: x['income'], reverse=True)
        
        raw_list.append({ "year": year, "items": items_raw })
        billion_list.append({ "year": year, "items": items_bil })
        
    return raw_list, billion_list

def generate_budget_split(budget_rows):
    years = sorted(list(set(int(row['year']) for row in budget_rows)))
    raw_list = []
    billion_list = []

    for year in years:
        rows = [r for r in budget_rows if int(r['year']) == year and r['type'] == 'Expenditure']
        
        agencies_raw = {}
        agencies_bil = {}
        
        for r in rows:
            agency = r['category_1'] or "Unknown"
            sub_agency = r['category_2'] or "General" 
            program = r['item_name'] or "General"
            
            amt_raw = parse_int(r['amount'])
            if amt_raw == 0: continue
            
            # Raw Tree Not built - Aggregating for performance safety in JSON?
            # User wants detail.
            
            if agency not in agencies_raw:
                agencies_raw[agency] = {"name": agency, "value": 0, "children": {}}
                agencies_bil[agency] = {"name": agency, "value": 0.0, "children": {}}
            
            agencies_raw[agency]["value"] += amt_raw
            # For billion tree, we sum floats.
            
            # Recursion for children...
            curr_raw = agencies_raw[agency]
            if program not in curr_raw["children"]:
                 curr_raw["children"][program] = {"name": program, "value": 0}
            curr_raw["children"][program]["value"] += amt_raw

        # Build Billion Tree from Raw Tree to avoid float accumulation errors
        for agency_name, agency_node in agencies_raw.items():
            bil_node = agencies_bil[agency_name]
            bil_node['value'] = scale_billions(agency_node['value'])
            
            for child_name, child_node in agency_node['children'].items():
                bil_node['children'][child_name] = {
                    "name": child_name,
                    "value": scale_billions(child_node['value'])
                }

        def transform_tree(agencies_dict):
             l = []
             for k, v in agencies_dict.items():
                 children_list = [{"name": ck, "value": cv["value"]} for ck, cv in v["children"].items()]
                 l.append({ "name": v["name"], "value": v["value"], "children": children_list })
             return l

        raw_list.append({ "year": year, "children": transform_tree(agencies_raw) })
        billion_list.append({ "year": year, "children": transform_tree(agencies_bil) })
        
    return raw_list, billion_list

def save_json(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    print("Starting V2 Split Data Transformation...")
    
    category_map = read_json(MAP_FILE)
    if not category_map: return

    summary_data = read_csv(os.path.join(DATA_DIR, "summary_all.csv"))
    funds_data = read_csv(os.path.join(DATA_DIR, "funds_all.csv"))
    budget_data = read_csv(os.path.join(DATA_DIR, "budget_all.csv"))

    # 1. Overview
    print("Generating Overview...")
    ov_raw, ov_bil = generate_overview_split(summary_data, category_map)
    save_json(ov_raw, os.path.join(OUTPUT_DIR, "raw/overview.json"))
    save_json(ov_bil, os.path.join(OUTPUT_DIR, "billion/overview.json"))

    # 2. Funds
    print("Generating Funds...")
    fd_raw, fd_bil = generate_funds_split(funds_data)
    save_json(fd_raw, os.path.join(OUTPUT_DIR, "raw/funds.json"))
    save_json(fd_bil, os.path.join(OUTPUT_DIR, "billion/funds.json"))

    # 3. Budget
    print("Generating Budget Details...")
    bd_raw, bd_bil = generate_budget_split(budget_data)
    save_json(bd_raw, os.path.join(OUTPUT_DIR, "raw/budget_detail.json"))
    save_json(bd_bil, os.path.join(OUTPUT_DIR, "billion/budget_detail.json"))
        
    print("Transformation Complete. Output in raw/ and billion/")

if __name__ == "__main__":
    main()
