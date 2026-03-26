const ALLOWED_ENDPOINTS = new Set(["TripUpdates", "Vehicles", "VehiclePositions"]);

export async function handler(event) {
  const splat = (event.path || "")
    .replace(/^\/\.netlify\/functions\/tfi\/?/, "")
    .split("/")
    .filter(Boolean)[0];

  if (!splat || !ALLOWED_ENDPOINTS.has(splat)) {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Unsupported TFI endpoint" }),
    };
  }

  const params = new URLSearchParams(event.queryStringParameters || {});
  if (!params.has("format")) {
    params.set("format", "json");
  }

  const apiKey = process.env.NTA_API_KEY || "";
  const url = `https://api.nationaltransport.ie/gtfsr/v2/${splat}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Ocp-Apim-Subscription-Key": apiKey,
        "x-api-key": apiKey,
        apikey: apiKey,
      },
    });

    const body = await response.text();
    return {
      statusCode: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
      body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "TFI proxy request failed" }),
    };
  }
}
