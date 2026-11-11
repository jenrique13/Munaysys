import os
import re

files_service = [
    'src/features/operative/services/operative.service.ts',
    'src/features/financial/services/financial.service.ts',
    'src/features/providers/services/providers.service.ts'
]

files_store = [
    'src/features/operative/hooks/useOperativeStore.ts',
    'src/features/financial/hooks/useFinancialStore.ts',
    'src/features/providers/hooks/useProvidersStore.ts'
]

# Fix Services
for fpath in files_service:
    full_path = 'd:/Proyectos/Munaysys/frontend/' + fpath
    if not os.path.exists(full_path): continue
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace (branchId = 1
    content = re.sub(r'\(branchId\s*=\s*1\)', '(branchId?: number)', content)
    # also for getAmenities(branchId = 1, ...
    content = re.sub(r'\(branchId\s*=\s*1,\s*', '(branchId?: number, ', content)
    # also for getBookings(branchId = 1, ...
    content = re.sub(r'\(branchId\s*=\s*1\s*,\s*', '(branchId?: number, ', content)

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix Stores
for fpath in files_store:
    full_path = 'd:/Proyectos/Munaysys/frontend/' + fpath
    if not os.path.exists(full_path): continue
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace fetch functions types: fetchClients: () => Promise<void>;
    updates = ['fetchClients', 'fetchOffices', 'fetchRooms', 'fetchProducts', 'fetchPackages', 'fetchOrders', 'fetchPurchases', 'fetchExpenses', 'fetchProviders', 'fetchPayables']
    for u in updates:
        content = re.sub(fr'{u}:\s*\(\)\s*=>', fr'{u}: (branchId?: number) =>', content)
        content = re.sub(fr'{u}:\s*async\s*\(\)\s*=>', fr'{u}: async (branchId) =>', content)
        # Update inside the async () to pass branchId
        if fpath == 'src/features/operative/hooks/useOperativeStore.ts':
            content = re.sub(fr'operativeService.get{u.replace("fetch", "")}\(\)', fr'operativeService.get{u.replace("fetch", "")}(branchId)', content)
        elif fpath == 'src/features/financial/hooks/useFinancialStore.ts':
            content = re.sub(fr'financialService.get{u.replace("fetch", "")}\(\)', fr'financialService.get{u.replace("fetch", "")}(branchId)', content)
        elif fpath == 'src/features/providers/hooks/useProvidersStore.ts':
            content = re.sub(fr'providersService.get{u.replace("fetch", "")}\(\)', fr'providersService.get{u.replace("fetch", "")}(branchId)', content)

    # specially for fetchBookings and fetchAmenities
    if fpath == 'src/features/operative/hooks/useOperativeStore.ts':
        content = re.sub(r'fetchBookings:\s*\(start\?:\s*string,\s*end\?:\s*string\)\s*=>', 'fetchBookings: (branchId?: number, start?: string, end?: string) =>', content)
        content = re.sub(r'fetchBookings:\s*async\s*\(start,\s*end\)\s*=>', 'fetchBookings: async (branchId, start, end) =>', content)
        content = re.sub(r'operativeService\.getBookings\(1,\s*start,\s*end\)', 'operativeService.getBookings(branchId, start, end)', content)

        content = re.sub(r'fetchAmenities:\s*\(clientId\?:\s*number,\s*spaceId\?:\s*number,\s*spaceType\?:\s*string\)\s*=>', 'fetchAmenities: (branchId?: number, clientId?: number, spaceId?: number, spaceType?: string) =>', content)
        content = re.sub(r'fetchAmenities:\s*async\s*\(clientId,\s*spaceId,\s*spaceType\)\s*=>', 'fetchAmenities: async (branchId, clientId, spaceId, spaceType) =>', content)
        content = re.sub(r'operativeService\.getAmenities\(1,\s*clientId,\s*spaceId,\s*spaceType\)', 'operativeService.getAmenities(branchId, clientId, spaceId, spaceType)', content)
    
    if fpath == 'src/features/providers/hooks/useProvidersStore.ts':
        content = re.sub(r'fetchPayables:\s*\(providerId\?:\s*number\)\s*=>', 'fetchPayables: (branchId?: number, providerId?: number) =>', content)
        content = re.sub(r'fetchPayables:\s*async\s*\(providerId\)\s*=>', 'fetchPayables: async (branchId, providerId) =>', content)
        content = re.sub(r'providersService\.getPayables\(1,\s*providerId\)', 'providersService.getPayables(branchId, providerId)', content)
        
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Updated frontend stores and services.')
