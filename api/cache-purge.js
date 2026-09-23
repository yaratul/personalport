import { purgeCloudflareCache } from './lib/cloudflare.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Security authorization: Bearer token or secret query param
  const authHeader = req.headers.authorization;
  const querySecret = req.query.secret;
  const purgeSecret = process.env.PURGE_SECRET || process.env.CF_API_TOKEN;

  if (purgeSecret) {
    const isAuthorized =
      (authHeader && authHeader === `Bearer ${purgeSecret}`) ||
      (querySecret && querySecret === purgeSecret);

    if (!isAuthorized) {
      return res.status(401).json({ error: 'Unauthorized. Provide valid Authorization header or secret query parameter.' });
    }
  }

  try {
    const { purgeEverything = true, files, tags, zoneId } = req.body || {};
    const result = await purgeCloudflareCache({
      zoneId,
      purgeEverything,
      files,
      tags
    });

    return res.status(200).json({
      success: true,
      message: 'Cloudflare edge cache purge request completed successfully.',
      result
    });
  } catch (error) {
    console.error('Cache purge error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
