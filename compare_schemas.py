import re

def parse_schema(filename):
    tables = {}
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(filename, 'r', encoding='utf-16') as f:
            content = f.read()
    
    # Extract tables
    table_pattern = re.compile(r'CREATE TABLE (public\.\w+) \((.*?)\);', re.IGNORECASE | re.DOTALL)
    for match in table_pattern.finditer(content):
        table_name = match.group(1).replace('public.', '')
        columns_str = match.group(2)
        
        # split columns by comma, but be careful with parentheses in types like character varying(255)
        # simplistic approach for now:
        lines = [line.strip() for line in columns_str.split('\n') if line.strip()]
        columns = {}
        for line in lines:
            if line.startswith('CONSTRAINT') or line.startswith('PRIMARY KEY') or line.startswith('UNIQUE') or line.startswith('FOREIGN KEY'):
                continue
            # first word is column name
            parts = line.split()
            if not parts:
                continue
            col_name = parts[0]
            col_def = " ".join(parts[1:]).strip(',')
            columns[col_name] = col_def
        tables[table_name] = columns
    return tables

def compare(db_schema, dump_schema):
    db_tables = set(db_schema.keys())
    dump_tables = set(dump_schema.keys())
    
    only_in_db = db_tables - dump_tables
    only_in_dump = dump_tables - db_tables
    common = db_tables & dump_tables
    
    print("=== Tables only in Current DB ===")
    for t in sorted(only_in_db):
        print(f" - {t}")
        
    print("\n=== Tables only in Dump ===")
    for t in sorted(only_in_dump):
        print(f" - {t}")
        
    print("\n=== Differing Tables ===")
    for t in sorted(common):
        db_cols = db_schema[t]
        dump_cols = dump_schema[t]
        
        db_col_names = set(db_cols.keys())
        dump_col_names = set(dump_cols.keys())
        
        only_in_db_cols = db_col_names - dump_col_names
        only_in_dump_cols = dump_col_names - db_col_names
        
        common_cols = db_col_names & dump_col_names
        diff_types = []
        for c in common_cols:
            if db_cols[c] != dump_cols[c]:
                diff_types.append((c, db_cols[c], dump_cols[c]))
                
        if only_in_db_cols or only_in_dump_cols or diff_types:
            print(f"\nTable: {t}")
            if only_in_db_cols:
                print(f"  Columns only in Current DB:")
                for c in sorted(only_in_db_cols):
                    print(f"   - {c}: {db_cols[c]}")
            if only_in_dump_cols:
                print(f"  Columns only in Dump:")
                for c in sorted(only_in_dump_cols):
                    print(f"   - {c}: {dump_cols[c]}")
            if diff_types:
                print(f"  Modified columns:")
                for c, db_t, dump_t in diff_types:
                    print(f"   - {c}:\n       Current DB: {db_t}\n       Dump:       {dump_t}")

if __name__ == '__main__':
    db_schema = parse_schema('current_schema.sql')
    dump_schema = parse_schema('dump_schema.sql')
    compare(db_schema, dump_schema)
