/**
 * Service de Synchronisation Hors-Ligne
 * Gère la mise en cache et la synchronisation des données terrain
 */

const DB_NAME = 'MokineFieldDB';
const DB_VERSION = 1;
const STORES = ['activities', 'locations', 'interventions', 'syncQueue'];

class OfflineSync {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPending();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Initialiser IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        STORES.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        });
      };
    });
  }

  // Sauvegarder une activité localement
  async saveActivity(activity) {
    const store = this.db
      .transaction(['activities'], 'readwrite')
      .objectStore('activities');
    return new Promise((resolve, reject) => {
      const request = store.add({ ...activity, id: `activity_${Date.now()}`, synced: false });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Sauvegarder une localisation
  async saveLocation(agentId, location) {
    const store = this.db
      .transaction(['locations'], 'readwrite')
      .objectStore('locations');
    return new Promise((resolve, reject) => {
      const request = store.put({
        id: agentId,
        agentId,
        ...location,
        timestamp: new Date().toISOString(),
        synced: false,
      });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Récupérer les données en attente de sync
  async getPendingData() {
    const activities = await this.getUnsyncedActivities();
    const locations = await this.getUnsyncedLocations();
    return { activities, locations };
  }

  // Récupérer les activités non synchronisées
  async getUnsyncedActivities() {
    const store = this.db
      .transaction(['activities'], 'readonly')
      .objectStore('activities');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result.filter(a => !a.synced);
        resolve(data);
      };
    });
  }

  // Récupérer les localisations non synchronisées
  async getUnsyncedLocations() {
    const store = this.db
      .transaction(['locations'], 'readonly')
      .objectStore('locations');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result.filter(l => !l.synced);
        resolve(data);
      };
    });
  }

  // Marquer comme synchronisé
  async markSynced(type, id) {
    const store = this.db
      .transaction([type], 'readwrite')
      .objectStore(type);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result;
        data.synced = true;
        const updateRequest = store.put(data);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve(data);
      };
    });
  }

  // Déclencher la synchronisation
  async syncPending() {
    if (!this.isOnline) return;

    try {
      const { activities, locations } = await this.getPendingData();

      // TODO: Implémenter les appels API pour synchroniser
      console.log('Synchronisation des données:', { activities, locations });

      // Marquer comme synchronisé après succès
      for (const activity of activities) {
        await this.markSynced('activities', activity.id);
      }
      for (const location of locations) {
        await this.markSynced('locations', location.id);
      }

      return { synced: true, count: activities.length + locations.length };
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      throw error;
    }
  }

  // Nettoyer les données anciennes
  async cleanup(daysOld = 30) {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
    
    ['activities', 'locations'].forEach(store => {
      const tx = this.db.transaction([store], 'readwrite');
      const objectStore = tx.objectStore(store);
      objectStore.getAll().onsuccess = (event) => {
        event.target.result
          .filter(item => item.timestamp < cutoff && item.synced)
          .forEach(item => objectStore.delete(item.id));
      };
    });
  }
}

export default new OfflineSync();
