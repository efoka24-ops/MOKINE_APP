import React from 'react';
import { useOffline } from '../context/OfflineContext.jsx';
import { useI18n } from '../i18n/index.js';

export default function OfflineIndicator() {
  const { isOnline, syncing, pendingCount } = useOffline();
  const { t } = useI18n();

  if (isOnline && !syncing && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-all ${!isOnline ? 'bg-red-600 text-white' : syncing ? 'bg-yellow-500 text-white' : 'bg-green-600 text-white'}`}>
      {!isOnline && (
        <>
          <span className="w-2 h-2 rounded-full bg-white opacity-80" />
          <span>{t('offline.offline')}</span>
          {pendingCount > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{t('offline.pending_actions', { count: pendingCount })}</span>}
        </>
      )}
      {isOnline && syncing && (
        <>
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{t('offline.syncing')}</span>
        </>
      )}
      {isOnline && !syncing && pendingCount === 0 && (
        <>
          <span>✓</span>
          <span>{t('offline.synced')}</span>
        </>
      )}
    </div>
  );
}
