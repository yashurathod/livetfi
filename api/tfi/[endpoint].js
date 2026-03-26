/**
 * Vercel Serverless Function - dynamic TFI API proxy
 * Matches routes like /api/tfi/TripUpdates and /api/tfi/Vehicles
 */

const ALLOWED_ENDPOINTS = new Set(["TripUpdates", "Vehicles", "VehiclePositions"]);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const apiKey = process.env.NTA_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "API configuration error",
      message: "NTA_API_KEY environment variable is missing",
    });
    return;
  }

  const endpointParam = req.query.endpoint;
  const endpoint = Array.isArray(endpointParam) ? endpointParam[0] : endpointParam;

  if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
    res.status(400).json({
      error: "Invalid endpoint",
      message: `Endpoint must be one of: ${Array.from(ALLOWED_ENDPOINTS).join(", ")}`,
    });
    return;
  }

  const formatParam = req.query.format;
  const format = Array.isArray(formatParam) ? formatParam[0] : formatParam;
  const queryFormat = format || "json";

  const target = `https://api.nationaltransport.ie/gtfsr/v2/${endpoint}?format=${encodeURIComponent(queryFormat)}`;

  try {
    const upstream = await fetch(target, {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });

    const text = await upstream.text();
    res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=5");
    res.status(upstream.status);

    try {
      res.json(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (error) {
    res.status(502).json({
      error: "Upstream request failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
