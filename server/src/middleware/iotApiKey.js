/**
 * IoT Device API Key middleware
 *
 * Firmware devices must send a shared secret via the X-IoT-Api-Key header.
 * The key is stored in the IOT_API_KEY environment variable.
 * This protects the unauthenticated sensor-data ingestion endpoint from
 * arbitrary injection by third parties.
 */

const IOT_API_KEY = process.env.IOT_API_KEY;

if (!IOT_API_KEY) {
  console.warn('[SECURITY] IOT_API_KEY is not set. IoT ingestion endpoint will reject all requests.');
}

export const verifyIotApiKey = (req, res, next) => {
  const provided = req.headers['x-iot-api-key'];

  if (!IOT_API_KEY) {
    return res.status(503).json({ error: 'IoT ingestion temporarily disabled.' });
  }

  if (!provided || provided !== IOT_API_KEY) {
    return res.status(401).json({ error: 'Clé API IoT invalide ou manquante.' });
  }

  next();
};
