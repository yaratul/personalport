import { uploadR2Object } from './lib/cloudflare.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { name, email, service, subject, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields (name, email, message).' });
  }

  const timestamp = new Date().toISOString();
  const inquiryRecord = {
    id: `lead_${Date.now()}`,
    timestamp,
    name,
    email,
    service: service || 'General Architecture',
    subject: subject || `Inquiry from ${name}`,
    message,
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  // 1. Audit Logging to Cloudflare R2 (if configured)
  let r2Logged = false;
  if (process.env.CF_S3_ENDPOINT && process.env.CF_ACCESS_KEY_ID && process.env.CF_SECRET_ACCESS_KEY) {
    try {
      const key = `inquiries/${new Date().toISOString().slice(0, 10)}/${inquiryRecord.id}.json`;
      await uploadR2Object({
        key,
        body: Buffer.from(JSON.stringify(inquiryRecord, null, 2), 'utf-8'),
        contentType: 'application/json',
        metadata: {
          clientName: name,
          clientEmail: email
        }
      });
      r2Logged = true;
    } catch (r2Err) {
      console.warn('Notice: Cloudflare R2 inquiry logging skipped or failed:', r2Err.message);
    }
  }

  // 2. Relay to owner@yaratul.com via FormSubmit AJAX Relay
  try {
    const relayResponse = await fetch('https://formsubmit.co/ajax/owner@yaratul.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://yaratul.com',
        'Referer': 'https://yaratul.com/'
      },
      body: JSON.stringify({
        name,
        email,
        service: service || 'General Inquiry',
        message,
        _subject: `New Enterprise Inquiry from ${name} (${service || 'General'}) — yaratul.com`,
        _replyto: email,
        _template: 'table',
        _captcha: 'false'
      })
    });

    const relayResult = await relayResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Request dispatched successfully! Yaser Ahmmed Ratul will respond within 12 hours.',
      inquiryId: inquiryRecord.id,
      r2Archived: r2Logged,
      relayStatus: relayResult.success || 'sent'
    });
  } catch (relayError) {
    console.error('Relay error in /api/contact:', relayError);

    // If R2 logged the lead, we didn't lose data
    if (r2Logged) {
      return res.status(200).json({
        success: true,
        message: 'Inquiry archived in R2 storage. Direct notification will be synchronized shortly.',
        inquiryId: inquiryRecord.id,
        r2Archived: true
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to route message. Please email directly to owner@yaratul.com.'
    });
  }
}
