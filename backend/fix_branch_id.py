import os
import re

files = [
    'app/api/operative.py',
    'app/api/financial.py',
    'app/api/providers.py',
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace ranch_id: int = 1 with ranch_id: Optional[int] = None
    content = re.sub(r'branch_id:\s*int\s*=\s*1', 'branch_id: Optional[int] = None', content)

    # Insert if branch_id is None: branch_id = current_user.branch_id or 1 at the beginning of the function body
    # We look for :\n    return crud.
    content = re.sub(r':\n    return crud\.', ':\n    if branch_id is None:\n        branch_id = current_user.branch_id or 1\n    return crud.', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Updated files.')
