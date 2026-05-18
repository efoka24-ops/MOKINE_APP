import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * FarmerRoute — Restreint l'accès aux éleveurs (role === 'farmer').
 * Redirige les vétérinaires vers /vet/dashboard et les autres vers /dashboard.
 */
export default function FarmerRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'veterinarian') return <Navigate to="/vet/dashboard" replace />;
  if (user.role === 'vendor')       return <Navigate to="/vendor/dashboard" replace />;
  if (user.role === 'admin')        return <Navigate to="/admin/dashboard" replace />;

  return children;
}
