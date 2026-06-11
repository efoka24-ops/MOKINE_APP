import React from 'react';
import { XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <XCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Paiement annulé</h2>
        <p className="text-gray-600 mb-6">
          Vous avez annulé le paiement. Aucun montant n'a été débité.
          Vous pouvez réessayer quand vous le souhaitez.
        </p>
        <button
          onClick={() => navigate('/abonnement')}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
        >
          Voir les abonnements
        </button>
        <button
          onClick={() => navigate('/')}
          className="mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

export default PaymentCancel;
