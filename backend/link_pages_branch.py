import os
import re

pages = [
    'src/features/operative/pages/ClientsPage.tsx',
    'src/features/operative/pages/OfficesPage.tsx',
    'src/features/operative/pages/RoomsPage.tsx',
    'src/features/operative/pages/BookingsPage.tsx',
    'src/features/financial/pages/ProductsPage.tsx',
    'src/features/financial/pages/OrdersPage.tsx',
    'src/features/financial/pages/PurchasesPage.tsx',
    'src/features/financial/pages/ExpensesPage.tsx',
    'src/features/providers/pages/ProvidersPage.tsx'
]

for fpath in pages:
    full_path = 'd:/Proyectos/Munaysys/frontend/' + fpath
    if not os.path.exists(full_path): continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Import useAuthStore if not present
    if 'useAuthStore' not in content:
        # insert after first import
        content = re.sub(r'(import .*?;)', r'\1\nimport { useAuthStore } from \'../../auth/hooks/useAuthStore\';', content, count=1)
        # if the path is providers/pages it should be '../../auth/hooks/...'
        # actually let's just use absolute-like path if possible. The alias isn't set.
        # Wait, for operative/pages, it's '../../auth/hooks/useAuthStore'.
        # For financial/pages, it's '../../auth/hooks/useAuthStore'.
        
    # 2. Extract hook inside component:
    # const { ... } = use...Store();
    # Let's just find the first const [showModal or const [ searchTerm and insert const { selectedBranchId } = useAuthStore(); before it.
    if 'selectedBranchId' not in content:
        content = re.sub(r'(const \[showModal.*?= useState.*?[\r\n]+)', r'const { selectedBranchId } = useAuthStore();\n    \1', content)

    # 3. Modify useEffect
    # From: useEffect(() => { fetchClients(); }, []);
    # To:   useEffect(() => { fetchClients(selectedBranchId ?? undefined); }, [selectedBranchId]);
    # Find fetchX();
    updates = ['fetchClients', 'fetchOffices', 'fetchRooms', 'fetchBookings', 'fetchProducts', 'fetchOrders', 'fetchPurchases', 'fetchExpenses', 'fetchProviders']
    for u in updates:
        if fpath == 'src/features/operative/pages/BookingsPage.tsx' and u == 'fetchBookings':
            content = re.sub(r'fetchBookings\(\);', r'fetchBookings(selectedBranchId ?? undefined);', content)
            content = re.sub(r'\}, \[\]\);', r'}, [selectedBranchId]);', content)
        else:
            content = re.sub(fr'{u}\(\);', fr'{u}(selectedBranchId ?? undefined);', content)
            content = re.sub(r'\}, \[\]\);', r'}, [selectedBranchId]);', content)

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Updated pages.')
