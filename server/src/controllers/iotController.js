import db from '../db/index.js';

const NORMAL_RANGES = {
  cattle: { temperature: { min: 38.0, max: 39.5 }, activity: { min: 30, max: 150 }, heartRate: { min: 48, max: 84 } },
  sheep:  { temperature: { min: 38.5, max: 40.0 }, activity: { min: 40, max: 180 }, heartRate: { min: 70, max: 90 } },
  goat:   { temperature: { min: 38.5, max: 40.5 }, activity: { min: 50, max: 200 }, heartRate: { min: 70, max: 90 } },
};

const checkNormal = (type, value, animalType) => {
  const range = NORMAL_RANGES[animalType]?.[type];
  if (!range) return true;
  return value >= range.min && value <= range.max;
};

// POST /api/iot/devices
export const registerDevice = async (req, res) => {
  try {
    const { animalId, type, model, rfidTag, firmwareVersion } = req.body;
    if (!animalId || !type) return res.status(400).json({ error: 'animalId et type requis' });
    const device = await db.iot_devices.insert({
      animalId, ownerId: req.user.id,
      type: type || 'collar',
      model: model || 'MokineCollar-v1',
      rfidTag: rfidTag || `RFID-${Date.now()}`,
      batteryLevel: 100, isOnline: false,
      firmwareVersion: firmwareVersion || '1.0.0',
      lastSeen: null,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ message: 'Dispositif IoT enregistré', device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/iot/devices
export const getDevices = async (req, res) => {
  try {
    const devices = await db.iot_devices.filter(d => d.ownerId === req.user.id);
    res.status(200).json({ devices, total: devices.length, onlineCount: devices.filter(d => d.isOnline).length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/iot/readings
export const ingestReading = async (req, res) => {
  try {
    const { deviceId, animalId, animalType, readings } = req.body;
    if (!deviceId || !readings || !Array.isArray(readings)) {
      return res.status(400).json({ error: 'deviceId et readings requis' });
    }
    const device = await db.iot_devices.findById(deviceId);
    if (device) {
      await db.iot_devices.update(deviceId, {
        isOnline: true, lastSeen: new Date().toISOString(),
        ...(req.body.batteryLevel !== undefined ? { batteryLevel: req.body.batteryLevel } : {}),
      });
    }
    const newReadings = [];
    const newAlerts = [];
    for (const r of readings) {
      const isNormal = checkNormal(r.type, r.value, animalType || 'cattle');
      const reading = await db.sensor_readings.insert({
        deviceId, animalId: animalId || device?.animalId,
        type: r.type, value: r.value, unit: r.unit,
        normal: isNormal, alert: !isNormal,
        timestamp: new Date().toISOString(),
      });
      newReadings.push(reading);
      if (!isNormal) {
        const alert = await db.iot_alerts.insert({
          deviceId, animalId: reading.animalId,
          ownerId: device?.ownerId,
          type: 'sensor_alert',
          metric: r.type,
          value: r.value, unit: r.unit,
          severity: r.type === 'temperature' && r.value > 41 ? 'critical' : 'high',
          message: `Anomalie ${r.type}: ${r.value}${r.unit} (hors norme)`,
          isRead: false, timestamp: new Date().toISOString(),
        });
        newAlerts.push(alert);
      }
    }
    res.status(201).json({ message: 'Données ingérées', readings: newReadings, alerts: newAlerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/iot/readings/:animalId
export const getAnimalReadings = async (req, res) => {
  try {
    const { animalId } = req.params;
    const { type, hours = 24 } = req.query;
    const since = new Date(Date.now() - parseInt(hours) * 3600000);
    let readings = await db.sensor_readings.filter(r =>
      r.animalId === animalId && new Date(r.timestamp) >= since
    );
    if (type) readings = readings.filter(r => r.type === type);
    readings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latest = {};
    readings.forEach(r => { if (!latest[r.type]) latest[r.type] = r; });
    res.status(200).json({ animalId, readings: readings.slice(0, 100), latest, totalReadings: readings.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/iot/alerts
export const getIoTAlerts = async (req, res) => {
  try {
    const userDevices = await db.iot_devices.filter(d => d.ownerId === req.user.id);
    const userDeviceIds = userDevices.map(d => d.id);
    const alerts = await db.iot_alerts.filter(a => userDeviceIds.includes(a.deviceId) || a.ownerId === req.user.id);
    res.status(200).json({ alerts: alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), unread: alerts.filter(a => !a.isRead).length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/iot/dashboard
export const getIoTDashboard = async (req, res) => {
  try {
    const userDevices = await db.iot_devices.filter(d => d.ownerId === req.user.id);
    const deviceIds = userDevices.map(d => d.id);
    const userAlerts = await db.iot_alerts.filter(a => deviceIds.includes(a.deviceId));
    const since24h = new Date(Date.now() - 24 * 3600000);
    const recentReadings = await db.sensor_readings.filter(r =>
      deviceIds.includes(r.deviceId) && new Date(r.timestamp) > since24h
    );
    const tempReadings = recentReadings.filter(r => r.type === 'temperature');
    res.status(200).json({
      devices: { total: userDevices.length, online: userDevices.filter(d => d.isOnline).length, lowBattery: userDevices.filter(d => d.batteryLevel < 20).length },
      alerts: { total: userAlerts.length, unread: userAlerts.filter(a => !a.isRead).length, critical: userAlerts.filter(a => a.severity === 'critical').length },
      sensors: { readings24h: recentReadings.length, anomalies: recentReadings.filter(r => !r.normal).length, avgTemperature: tempReadings.length ? (tempReadings.reduce((s, r) => s + r.value, 0) / tempReadings.length).toFixed(1) : null },
      deviceList: userDevices,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
