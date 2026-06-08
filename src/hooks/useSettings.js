import { useState, useEffect } from 'react';

const DEFAULTS = {
  app_name: 'Mokine',
  business_name: 'CM TRU GROUP',
  business_address: 'Garoua, Cameroun',
  business_phone: '678758976',
  business_email: 'infos@trugroup.cm',
  support_email: 'infos@trugroup.cm',
  currency: 'XAF',
  country_code: 'CM',
  easy_transact_service_code: 'DEPOSIT',
};

let _cache = null;
let _promise = null;

const fetchSettings = () => {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = fetch('/api/settings')
    .then(r => r.ok ? r.json() : {})
    .then(data => { _cache = { ...DEFAULTS, ...data }; _promise = null; return _cache; })
    .catch(() => { _promise = null; return DEFAULTS; });
  return _promise;
};

export function useSettings() {
  const [settings, setSettings] = useState(_cache || DEFAULTS);
  useEffect(() => { fetchSettings().then(setSettings); }, []);
  return settings;
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/subscription-plans')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPlans(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return { plans, loading };
}
