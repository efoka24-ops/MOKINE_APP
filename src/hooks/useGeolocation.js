/**
 * Hook pour Géolocalisation
 * Suivi GPS en temps réel avec débit adaptatif
 */

import { useState, useEffect, useCallback } from 'react';

export const useGeolocation = (options = {}) => {
  const {
    highAccuracy = false,
    timeout = 10000,
    maximumAge = 0,
    updateInterval = 5000, // Mettre à jour toutes les 5 secondes
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtenir la localisation
  const getLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Géolocalisation non supportée');
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toISOString(),
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { highAccuracy, timeout, maximumAge }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [highAccuracy, timeout, maximumAge]);

  useEffect(() => {
    const cleanup = getLocation();
    return cleanup;
  }, [getLocation]);

  return { location, error, loading };
};

/**
 * Hook pour Synchronisation avec Throttle
 * Limite les appels API lors du mouvement
 */
export const usePedometer = (callback, interval = 1000) => {
  useEffect(() => {
    if (!('Accelerometer' in window)) return;

    try {
      const accel = new window.Accelerometer({ frequency: 1 / interval });
      let lastCall = 0;

      accel.addEventListener('reading', () => {
        const now = Date.now();
        if (now - lastCall >= interval) {
          const movement = Math.sqrt(
            accel.x ** 2 + accel.y ** 2 + accel.z ** 2
          );
          callback(movement);
          lastCall = now;
        }
      });

      accel.addEventListener('error', (event) => {
        console.warn('Erreur capteur:', event.error.name);
      });

      accel.start();
      return () => accel.stop();
    } catch (err) {
      console.warn('Accéléromètre non disponible:', err);
    }
  }, [callback, interval]);
};

/**
 * Hook pour Batterie
 * Adapte la fréquence de mise à jour selon la batterie
 */
export const useBatteryStatus = () => {
  const [battery, setBattery] = useState(null);

  useEffect(() => {
    if (!('getBattery' in navigator) && !('getBatteryStatus' in navigator)) {
      return;
    }

    const updateBattery = (level, charging, chargingTime) => {
      setBattery({
        level: level * 100,
        charging,
        chargingTime,
      });
    };

    // Essayer Battery Status API
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        updateBattery(
          battery.level,
          battery.charging,
          battery.chargingTime
        );
        battery.addEventListener('levelchange', () =>
          updateBattery(battery.level, battery.charging, battery.chargingTime)
        );
      });
    }

    return () => {};
  }, []);

  return battery;
};

export default { useGeolocation, usePedometer, useBatteryStatus };
