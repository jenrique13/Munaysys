import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/templates/MainLayout';
import { PipelinePage } from './features/crm/pages/PipelinePage';
import { ProspectosPage } from './features/crm/pages/ProspectosPage';
import { PresupuestosPage } from './features/crm/pages/PresupuestosPage';
import RoleDashboard from './features/dashboards/pages/RoleDashboard';
import ClientsPage from './features/operative/pages/ClientsPage';
import OfficePage from './features/operative/pages/OfficePage';
import EspaciosPage from './features/operative/pages/EspaciosPage';
import RoomsPage from './features/operative/pages/RoomsPage';
import BookingsPage from './features/operative/pages/BookingsPage';
import MembershipsPage from './features/operative/pages/MembershipsPage';
import OrdersPage from './features/financial/pages/OrdersPage';
import PurchasesPage from './features/financial/pages/PurchasesPage';
import ExpensesPage from './features/financial/pages/ExpensesPage';
import BillingPage from './features/financial/pages/BillingPage';
import ReceivablesPage from './features/financial/pages/ReceivablesPage';
import CashFlowPage from './features/financial/pages/CashFlowPage';
import ProvidersPage from './features/financial/pages/ProvidersPage';
import PayablesPage from './features/financial/pages/PayablesPage';
import ProductsPage from './features/financial/pages/ProductsPage';
import ServicesPage from './features/financial/pages/ServicesPage';
import ConsumablesPage from './features/financial/pages/ConsumablesPage';
import ManagementPage from './features/management/pages/ManagementPage';
import DashboardPage from './features/financial/pages/DashboardPage';
import CatalogsPage from './features/financial/pages/CatalogsPage';
import UsersPage from './features/configuration/pages/UsersPage';
import RolesPage from './features/configuration/pages/RolesPage';
import BranchesPage from './features/configuration/pages/BranchesPage';
import LoginPage from './features/auth/pages/LoginPage';
import ReportesPage from './features/reports/pages/ReportesPage';
import { useAuthStore } from './features/auth/hooks/useAuthStore';

import { useSystemStore } from './features/system/hooks/useSystemStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { fetchCurrentUser } = useAuthStore();
  const { fetchBcvRates } = useSystemStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        await Promise.all([
          fetchCurrentUser(),
          fetchBcvRates()
        ]);
      } catch (e) {
        console.error("No se pudo iniciar sesion o cargar conf", e);
      } finally {
        setIsAuthReady(true);
      }
    };
    initAuth();
  }, [fetchCurrentUser, fetchBcvRates]);

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<RoleDashboard />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="prospectos" element={<ProspectosPage />} />
          <Route path="presupuestos" element={<PresupuestosPage />} />

          {/* Operativo */}
          <Route path="clients" element={<ClientsPage />} />
          <Route path="offices" element={<OfficePage />} />
          <Route path="espacios" element={<EspaciosPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="memberships" element={<MembershipsPage />} />

          {/* Financiero */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="consumables" element={<ConsumablesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="proveedores" element={<ProvidersPage />} />
          <Route path="cuentas-por-pagar" element={<PayablesPage />} />
          <Route path="cuentas-por-cobrar" element={<ReceivablesPage />} />
          <Route path="caja" element={<CashFlowPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="catalogos" element={<CatalogsPage />} />

          {/* Rutas Pendientes */}
          <Route path="clientes" element={<Navigate to="/clients" replace />} />
          <Route path="salas" element={<Navigate to="/rooms" replace />} />

          {/* Gerencia */}
          <Route path="gerencia" element={<ManagementPage />} />

          {/* Reportes */}
          <Route path="reportes" element={<ReportesPage />} />

          {/* Gestión / Configuración */}
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="branches" element={<BranchesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
