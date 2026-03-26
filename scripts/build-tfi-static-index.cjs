const { execSync } = require('node:child_process');
const fs = require('node:fs');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (ch !== '\r') {
        field += ch;
      }
    }

    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function rowsToObjects(rows) {
  const [headers, ...body] = rows;

  return body
    .filter((r) => r.length > 1)
    .map((r) => {
      const obj = {};
      for (let i = 0; i < headers.length; i += 1) {
        obj[headers[i]] = r[i] ?? '';
      }
      return obj;
    });
}

function main() {
  const routesTxt = execSync('unzip -p /tmp/GTFS_Realtime.zip routes.txt', {
    maxBuffer: 20 * 1024 * 1024,
    encoding: 'utf8',
  });

  const stopsTxt = execSync('unzip -p /tmp/GTFS_Realtime.zip stops.txt', {
    maxBuffer: 20 * 1024 * 1024,
    encoding: 'utf8',
  });

  const fallbackStopsTxt = execSync('unzip -p /tmp/GTFS_All.zip stops.txt', {
    maxBuffer: 40 * 1024 * 1024,
    encoding: 'utf8',
  });

  const routesRows = rowsToObjects(parseCsv(routesTxt));
  const stopsRows = rowsToObjects(parseCsv(stopsTxt));
  const fallbackStopsRows = rowsToObjects(parseCsv(fallbackStopsTxt));

  const routesById = {};
  const routesByRealtimeId = {};
  for (const route of routesRows) {
    const routeId = route.route_id;
    if (!routeId) continue;
    const routeMeta = {
      shortName: route.route_short_name || routeId,
      longName: route.route_long_name || '',
      agencyId: route.agency_id || '',
    };

    routesById[routeId] = routeMeta;

    const suffix = routeId.includes('_') ? routeId.split('_').pop() : routeId;
    if (suffix && !routesByRealtimeId[suffix]) {
      routesByRealtimeId[suffix] = routeMeta;
    }
  }

  const stopsById = {};
  const stopsByCode = {};
  const stopsByRealtimeId = {};
  const suffixCandidateCounts = {};
  const suffixCandidateMeta = {};
  const allStopsRows = [...stopsRows, ...fallbackStopsRows];

  for (const stop of allStopsRows) {
    const stopId = stop.stop_id;
    const stopCode = stop.stop_code;
    const lat = Number(stop.stop_lat);
    const lng = Number(stop.stop_lon);
    if (!stopId || Number.isNaN(lat) || Number.isNaN(lng)) continue;

    const stopMeta = {
      name: stop.stop_name || stopId,
      lat,
      lng,
    };

    stopsById[stopId] = stopMeta;

    if (stopCode && !stopsByCode[stopCode]) {
      stopsByCode[stopCode] = stopMeta;

      const numericCode = /^\d+$/.test(stopCode) ? stopCode : "";
      if (numericCode) {
        const lengths = [4, 5, 6];
        for (const len of lengths) {
          if (numericCode.length >= len) {
            const suffix = numericCode.slice(-len);
            suffixCandidateCounts[suffix] = (suffixCandidateCounts[suffix] || 0) + 1;
            if (!suffixCandidateMeta[suffix]) {
              suffixCandidateMeta[suffix] = stopMeta;
            }
          }
        }
      }
    }
  }

  for (const [suffix, count] of Object.entries(suffixCandidateCounts)) {
    if (count === 1) {
      stopsByRealtimeId[suffix] = suffixCandidateMeta[suffix];
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    routeCount: Object.keys(routesById).length,
    stopCount: Object.keys(stopsById).length,
    routesById,
    routesByRealtimeId,
    stopsById,
    stopsByCode,
    stopsByRealtimeId,
  };

  fs.mkdirSync('public', { recursive: true });
  fs.writeFileSync('public/tfi-static.json', JSON.stringify(out));

  console.log('Wrote public/tfi-static.json');
  console.log('routeCount:', out.routeCount, 'stopCount:', out.stopCount);
}

main();
