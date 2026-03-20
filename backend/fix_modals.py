import re

files_and_modals = [
    ('src/features/operative/pages/BookingsPage.tsx', 'NewBookingModal'),
    ('src/features/financial/pages/OrdersPage.tsx', 'NewOrderModal'),
    ('src/features/financial/pages/PurchasesPage.tsx', 'NewPurchaseModal'),
    ('src/features/financial/pages/ExpensesPage.tsx', 'NewExpenseModal')
]

for fpath, modal_name in files_and_modals:
    full_path = 'd:/Proyectos/Munaysys/frontend/' + fpath
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # inject const { selectedBranchId } = useAuthStore(); right after the modal declaration
    pattern = fr'(const {modal_name}: React.FC<.*?> = \({{.*?}}\) => {{\n)'
    replacement = r'\1    const { selectedBranchId } = useAuthStore();\n'
    content = re.sub(pattern, replacement, content)
    
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Modals fixed.')
