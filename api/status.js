import { checkCloudflareHealth, getZoneId } from './lib/cloudflare.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = await checkCloudflareHealth();

    // Optionally attempt non-invasive zone check if API is configured
    if (health.apiConfigured) {
      try {
        const zoneId = await getZoneId('yaratul.com');
        health.zoneDetected = zoneId ? 'Connected (Zone found)' : 'Unknown';
      } catch (err) {
        health.zoneDetected = `Notice: ${err.message}`;
      }
    }

    return res.status(200).json({
      status: 'operational',
      environment: process.env.VERCEL_ENV || 'production',
      cloudflare: health
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}
