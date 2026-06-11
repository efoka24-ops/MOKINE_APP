import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { camooPayment as camooAPI } from '../API';

export function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan  = searchParams.get('plan');
  const ref   = searchParams.get('ref');
  const txId  = searchParams.get('id');  // Camoo cashOut.id

  const [txStatus, setTxStatus] = useState('pending');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!txId && !ref) { setTxStatus('unknown'); return; }

    let count = 0;
    const MAX = 10;

    const poll = async () => {
      try {
        const { data } = await camooAPI.verify(txId || ref);
        const s = (data?.verify?.status || '').toLowerCase();
        if (s === 'success') { setTxStatus('success'); return; }
        if (['failed', 'timeout', 'expired', 'reversed'].includes(s)) { setTxStatus('failed'); return; }
      } catch { /* ignore */ }

      count++;
      setAttempts(count);
      if (count < MAX) setTimeout(poll, 5000);
      else setTxStatus('unknown');
    };

    // First check after 3s to give Camoo time to process
    setTimeout(poll, 3000);
  }, [txId, ref]);

  const isDone = txStatus === 'success' || txStatus === 'unknown';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        {txStatus === 'failed' ? (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Paiement échoué</h2>
            <p className="text-gray-600 mb-6">Le paiement n'a pas pu être traité. Veuillez réessayer.</p>
            <button
              onClick={() => navigate(plan ? `/paiement/${plan}` : '/abonnement')}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl"
            >
              Réessayer
            </button>
          </>
        ) : (
          <>
            {isDone ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            ) : (
              <Loader className="w-16 h-16 text-green-400 animate-spin mx-auto mb-4" />
            )}

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isDone ? 'Paiement reçu !' : 'En attente de confirmation…'}
            </h2>

            <p className="text-gray-600 mb-2">
              {isDone
                ? "Votre abonnement est en cours d'activation. Cela peut prendre quelques minutes."
                : 'Validez le paiement sur votre téléphone, puis attendez la confirmation.'}
            </p>

            {!isDone && (
              <p className="text-sm text-gray-400 mb-2">
                Vérification {attempts}/{10}…
              </p>
            )}

            {ref && (
              <p className="text-xs text-gray-400 mb-6 font-mono">Réf : {ref}</p>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              disabled={!isDone}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              Accéder à mon espace <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/abonnement')}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Retour aux abonnements
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccess;
