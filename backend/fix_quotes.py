import os

files = [
    'src/features/operative/pages/RoomsPage.tsx',
    'src/features/operative/pages/ClientsPage.tsx',
    'src/features/financial/pages/PurchasesPage.tsx',
    'src/features/financial/pages/OrdersPage.tsx',
    'src/features/financial/pages/ExpensesPage.tsx',
    'src/features/financial/pages/ProductsPage.tsx',
    'src/features/operative/pages/OfficesPage.tsx'
]

for fpath in files:
    full_path = 'd:/Proyectos/Munaysys/frontend/' + fpath
    if not os.path.exists(full_path): continue
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace("from \\'../../auth/hooks/useAuthStore\\';", "from '../../auth/hooks/useAuthStore';")
    
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Quotes fixed.')
