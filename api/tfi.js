/**
 * Vercel Serverless Function - TFI API Proxy
 * Proxies requests to TFI GTFS-RT API with authentication
 */

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const API_KEY = process.env.NTA_API_KEY;

  if (!API_KEY) {
    console.error('[TFI API] NTA_API_KEY not configured');
    return res.status(500).json({ 
      error: 'API configuration error',
      message: 'NTA_API_KEY environment variable not set'
    });
  }

  // Get endpoint from query or path
  let endpoint = req.query.endpoint || 'TripUpdates';
  
  // Handle path format: /api/tfi/TripUpdates
  if (req.url && req.url.includes('/api/tfi/')) {
    const parts = req.url.split('/api/tfi/');
    if (parts[1]) {
      endpoint = parts[1].split('?')[0];
    }
  }

  const format = req.query.format || 'json';
  const url = `https://api.nationaltransport.ie/gtfsr/v2/${endpoint}?format=${format}`;

  try {
    console.log(`[TFI API] Proxying ${endpoint}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json',
      },
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=5');
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`[TFI API] Error fetching ${endpoint}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch from TFI API',
      message: error.message,
      endpoint 
    });
  }
}
