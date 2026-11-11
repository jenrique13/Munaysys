import React from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { DashboardPage } from './DashboardPage';
import OperadorDashboard from './OperadorDashboard';
import CoordinadorDashboard from './CoordinadorDashboard';
import VentasDashboard from './VentasDashboard';

/**
 * RoleDashboard:
 * Acts as the entry point for '/' route, selecting the correct
 * dashboard component based on the logged-in user's role.
 */
const RoleDashboard: React.FC = () => {
    const { user } = useAuthStore();

    if (!user) return null;

    const roleName = user.role?.name;

    if (user.is_superuser || roleName === 'Gerente') {
        return <DashboardPage />; // Full managerial dashboard
    }
    if (roleName === 'Coordinador') {
        return <CoordinadorDashboard />;
    }
    if (roleName === 'Operador') {
        return <OperadorDashboard />;
    }
    if (roleName === 'Ventas') {
        return <VentasDashboard />;
    }

    // Fallback: show full dashboard
    return <DashboardPage />;
};

export default RoleDashboard;
