import {
  listR2Objects,
  uploadR2Object,
  generateR2UploadUrl,
  generateR2DownloadUrl
} from './lib/cloudflare.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || (req.method === 'GET' ? 'list' : 'presign');
  const bucket = req.query.bucket || req.body?.bucket || process.env.R2_BUCKET_NAME || 'yaratul-media';

  try {
    // 1. List objects in R2
    if (action === 'list') {
      const prefix = req.query.prefix || '';
      const maxKeys = parseInt(req.query.maxKeys || '100', 10);
      const data = await listR2Objects({ bucket, prefix, maxKeys });
      
      const contents = (data.Contents || []).map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag
      }));

      return res.status(200).json({
        success: true,
        bucket,
        prefix,
        count: contents.length,
        objects: contents
      });
    }

    // 2. Generate Pre-signed Upload URL for direct client-to-R2 upload
    if (action === 'presign') {
      const { key, contentType, expiresIn } = req.body || {};
      if (!key) {
        return res.status(400).json({ error: 'Missing "key" in request body.' });
      }

      const presignResult = await generateR2UploadUrl({
        bucket,
        key,
        contentType: contentType || 'application/octet-stream',
        expiresIn: expiresIn || 3600
      });

      return res.status(200).json({
        success: true,
        ...presignResult
      });
    }

    // 3. Generate Pre-signed Download URL
    if (action === 'download') {
      const key = req.query.key || req.body?.key;
      if (!key) {
        return res.status(400).json({ error: 'Missing "key" parameter.' });
      }

      const downloadUrl = await generateR2DownloadUrl({
        bucket,
        key,
        expiresIn: 3600
      });

      return res.status(200).json({
        success: true,
        downloadUrl
      });
    }

    // 4. Direct Upload (JSON payload / base64 or text)
    if (action === 'upload') {
      const { key, content, contentType, isBase64 } = req.body || {};
      if (!key || !content) {
        return res.status(400).json({ error: 'Missing "key" or "content" in request body.' });
      }

      const bodyBuffer = isBase64 ? Buffer.from(content, 'base64') : Buffer.from(content, 'utf-8');
      await uploadR2Object({
        bucket,
        key,
        body: bodyBuffer,
        contentType: contentType || 'application/octet-stream'
      });

      return res.status(200).json({
        success: true,
        message: 'Object uploaded to R2 successfully.',
        bucket,
        key
      });
    }

    return res.status(400).json({ error: `Unknown action: "${action}"` });
  } catch (error) {
    console.error('R2 API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
