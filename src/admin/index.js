// Module pages
export { default as AdminDashboard } from './pages/AdminDashboard.jsx';
export { default as AdminCollarsPage } from './pages/AdminCollarsPage.jsx';
export { default as VetoModule } from './pages/VetoModule.jsx';
export { default as BoxModule } from './pages/BoxModule.jsx';
export { default as MarketModule } from './pages/MarketModule.jsx';
export { default as LabModule } from './pages/LabModule.jsx';
export { default as FieldModule } from './pages/FieldModule.jsx';
export { default as SystemModule } from './pages/SystemModule.jsx';

// Legacy page exports (kept for backward compat, redirect to new modules)
export { default as AdminUsers } from './pages/AdminUsers.jsx';
export { default as AdminVeterinarians } from './pages/AdminVeterinarians.jsx';
export { default as AdminPayments } from './pages/AdminPayments.jsx';
export { default as AdminProducts } from './pages/AdminProducts.jsx';
export { default as AdminSettings } from './pages/AdminSettings.jsx';

// Shared components
export { default as AdminLayout } from './components/AdminLayout.jsx';
export { default as AdminSidebar } from './components/AdminSidebar.jsx';
export { default as DataTable } from './components/DataTable.jsx';
export { default as StatBox } from './components/StatBox.jsx';
export { default as ProtectedRoute } from './ProtectedRoute.jsx';
