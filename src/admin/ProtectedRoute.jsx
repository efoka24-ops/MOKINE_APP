import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute - Protège les routes admin
 * Vérifie que l'utilisateur est connecté et a un rôle admin
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('mokine_token');
  let userRole = null;
  try {
    const raw = localStorage.getItem('mokine_user');
    if (raw) userRole = JSON.parse(raw)?.role;
  } catch { /* ignore */ }

  // Si pas de token ou pas admin, redirection vers login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier le rôle admin
  if (userRole !== 'admin' && userRole !== 'Administrator') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Accès Refusé</h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions pour accéder au back office administrateur.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Rôle détecté: <strong>{userRole || 'Unknown'}</strong>
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retourner à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return children;
}
