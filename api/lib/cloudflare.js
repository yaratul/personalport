/**
 * Cloudflare Core Integration Module for yaratul.com
 * Supports Cloudflare R2 (S3-compatible API) and Cloudflare Management API v4.
 */

import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * -----------------------------------------------------------------------------
 * 1. Cloudflare R2 Storage Client (S3 Compatible)
 * -----------------------------------------------------------------------------
 */
let cachedS3Client = null;

export function getR2Client() {
  const endpoint = process.env.CF_S3_ENDPOINT;
  const accessKeyId = process.env.CF_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CF_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Cloudflare R2 credentials (CF_S3_ENDPOINT, CF_ACCESS_KEY_ID, CF_SECRET_ACCESS_KEY).');
  }

  if (!cachedS3Client) {
    cachedS3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      }
    });
  }

  return cachedS3Client;
}

/**
 * List objects stored inside an R2 bucket
 */
export async function listR2Objects({ bucket = process.env.R2_BUCKET_NAME || 'yaratul-media', prefix = '', maxKeys = 100 } = {}) {
  const client = getR2Client();
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: maxKeys
  });
  return await client.send(command);
}

/**
 * Upload an object directly to R2
 */
export async function uploadR2Object({
  bucket = process.env.R2_BUCKET_NAME || 'yaratul-media',
  key,
  body,
  contentType = 'application/octet-stream',
  metadata = {}
}) {
  if (!key) throw new Error('Object key is required for R2 upload.');
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata
  });
  return await client.send(command);
}

/**
 * Retrieve an object from R2
 */
export async function getR2Object({ bucket = process.env.R2_BUCKET_NAME || 'yaratul-media', key }) {
  if (!key) throw new Error('Object key is required.');
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });
  return await client.send(command);
}

/**
 * Delete an object from R2
 */
export async function deleteR2Object({ bucket = process.env.R2_BUCKET_NAME || 'yaratul-media', key }) {
  if (!key) throw new Error('Object key is required.');
  const client = getR2Client();
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key
  });
  return await client.send(command);
}

/**
 * Generate a pre-signed URL for direct browser-to-R2 upload (zero-latency, zero-egress)
 */
export async function generateR2UploadUrl({
  bucket = process.env.R2_BUCKET_NAME || 'yaratul-media',
  key,
  contentType = 'application/octet-stream',
  expiresIn = 3600
}) {
  if (!key) throw new Error('Object key is required.');
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });
  const presignedUrl = await getSignedUrl(client, command, { expiresIn });
  return {
    uploadUrl: presignedUrl,
    key: key,
    bucket: bucket,
    expiresIn: expiresIn
  };
}

/**
 * Generate a pre-signed download URL for private R2 assets
 */
export async function generateR2DownloadUrl({
  bucket = process.env.R2_BUCKET_NAME || 'yaratul-media',
  key,
  expiresIn = 3600
}) {
  if (!key) throw new Error('Object key is required.');
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });
  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * -----------------------------------------------------------------------------
 * 2. Cloudflare Management API Client (Cache Purge, Zones, Account)
 * -----------------------------------------------------------------------------
 */

/**
 * Make an authenticated HTTP request to the Cloudflare API v4
 */
export async function cfApiRequest(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const apiToken = process.env.CF_API_TOKEN;
  const globalApiKey = process.env.CF_GLOBAL_API_KEY;
  const cfEmail = process.env.CF_EMAIL || 'owner@yaratul.com';

  const authHeaders = {};
  if (apiToken) {
    authHeaders['Authorization'] = `Bearer ${apiToken}`;
  } else if (globalApiKey) {
    authHeaders['X-Auth-Key'] = globalApiKey;
    authHeaders['X-Auth-Email'] = cfEmail;
  } else {
    throw new Error('Missing Cloudflare API authentication (CF_API_TOKEN or CF_GLOBAL_API_KEY).');
  }

  const response = await fetch(`${CF_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    const errorDetails = data.errors ? JSON.stringify(data.errors) : response.statusText;
    throw new Error(`Cloudflare API Error [${response.status}]: ${errorDetails}`);
  }

  return data;
}

/**
 * Look up the Zone ID for a given domain (defaults to yaratul.com)
 */
export async function getZoneId(domain = 'yaratul.com') {
  if (process.env.CF_ZONE_ID) {
    return process.env.CF_ZONE_ID;
  }
  const result = await cfApiRequest(`/zones?name=${encodeURIComponent(domain)}`);
  if (!result.result || result.result.length === 0) {
    throw new Error(`Zone for domain "${domain}" not found in Cloudflare account.`);
  }
  return result.result[0].id;
}

/**
 * Purge Cloudflare Edge Cache for yaratul.com
 * @param {Object} options
 * @param {string} [options.zoneId] - Zone ID (auto-discovered if omitted)
 * @param {boolean} [options.purgeEverything=true] - Purge entire cache
 * @param {string[]} [options.files] - Specific URLs to purge
 * @param {string[]} [options.tags] - Cache tags to purge
 */
export async function purgeCloudflareCache({ zoneId, purgeEverything = true, files, tags } = {}) {
  const targetZoneId = zoneId || await getZoneId('yaratul.com');
  const payload = {};

  if (purgeEverything) {
    payload.purge_everything = true;
  } else {
    if (files && files.length > 0) payload.files = files;
    if (tags && tags.length > 0) payload.tags = tags;
  }

  return await cfApiRequest(`/zones/${targetZoneId}/purge_cache`, {
    method: 'POST',
    body: payload
  });
}

/**
 * Check overall Cloudflare infrastructure health and credential configuration
 */
export async function checkCloudflareHealth() {
  const status = {
    timestamp: new Date().toISOString(),
    credentials: {
      hasS3Endpoint: !!process.env.CF_S3_ENDPOINT,
      hasAccessKeyId: !!process.env.CF_ACCESS_KEY_ID,
      hasSecretAccessKey: !!process.env.CF_SECRET_ACCESS_KEY,
      hasApiToken: !!process.env.CF_API_TOKEN,
      hasAccountId: !!process.env.CF_ACCOUNT_ID,
      hasGlobalApiKey: !!process.env.CF_GLOBAL_API_KEY
    },
    r2Configured: false,
    apiConfigured: false,
    zoneDetected: null
  };

  status.r2Configured = status.credentials.hasS3Endpoint &&
                        status.credentials.hasAccessKeyId &&
                        status.credentials.hasSecretAccessKey;

  status.apiConfigured = (status.credentials.hasApiToken || status.credentials.hasGlobalApiKey) &&
                         status.credentials.hasAccountId;

  return status;
}
