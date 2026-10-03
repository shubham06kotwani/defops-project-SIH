const express = require('express');
const router = express.Router();
const https = require('https');

// WMO Weather interpretation code mapper
function getWeatherDescription(code) {
  switch (code) {
    case 0: return { label: 'Clear Sky', icon: '☀️', condition: 'OPTIMAL' };
    case 1: return { label: 'Mainly Clear', icon: '🌤️', condition: 'OPTIMAL' };
    case 2: return { label: 'Partly Cloudy', icon: '⛅', condition: 'FAIR' };
    case 3: return { label: 'Overcast', icon: '☁️', condition: 'FAIR' };
    case 45: return { label: 'Fog / Low Visibility', icon: '🌫️', condition: 'ADVERSE' };
    case 48: return { label: 'Depositing Rime Fog', icon: '🌫️', condition: 'ADVERSE' };
    case 51: case 53: case 55: return { label: 'Drizzle', icon: '🌦️', condition: 'ADVERSE' };
    case 61: case 63: case 65: return { label: 'Rain / Wet Terrain', icon: '🌧️', condition: 'HAZARDOUS' };
    case 71: case 73: case 75: return { label: 'Snowfall / Alpine Ice', icon: '❄️', condition: 'CRITICAL' };
    case 77: return { label: 'Snow Grains', icon: '🌨️', condition: 'CRITICAL' };
    case 80: case 81: case 82: return { label: 'Rain Showers', icon: '🌧️', condition: 'HAZARDOUS' };
    case 85: case 86: return { label: 'Severe Snow Blizzard', icon: '❄️', condition: 'CRITICAL' };
    case 95: case 96: case 99: return { label: 'High Altitude Thunderstorm', icon: '⛈️', condition: 'CRITICAL' };
    default: return { label: 'Tactical Atmosphere Nominal', icon: '🛰️', condition: 'OPTIMAL' };
  }
}

// Fallback tactical registry if external network is air-gapped
const AIRGAP_TACTICAL_REGISTRY = [
  { id: 'leh-01', name: 'Leh', latitude: 34.1526, longitude: 77.5771, elevation: 3500, country: 'India', region: 'Ladakh' },
  { id: 'kargil-01', name: 'Kargil', latitude: 34.5576, longitude: 76.1262, elevation: 2686, country: 'India', region: 'Ladakh' },
  { id: 'siachen-01', name: 'Siachen Base Camp', latitude: 35.1970, longitude: 77.1700, elevation: 5400, country: 'India', region: 'Ladakh' },
  { id: 'dras-01', name: 'Dras', latitude: 34.4300, longitude: 75.7600, elevation: 3300, country: 'India', region: 'Ladakh' },
  { id: 'srinagar-01', name: 'Srinagar', latitude: 34.0837, longitude: 74.7973, elevation: 1585, country: 'India', region: 'Jammu and Kashmir' },
  { id: 'manali-01', name: 'Manali', latitude: 32.2432, longitude: 77.1892, elevation: 2050, country: 'India', region: 'Himachal Pradesh' },
  { id: 'khardung-01', name: 'Khardung La', latitude: 34.2787, longitude: 77.6047, elevation: 5359, country: 'India', region: 'Ladakh' },
  { id: 'zoji-01', name: 'Zoji La', latitude: 34.2800, longitude: 75.5000, elevation: 3528, country: 'India', region: 'Ladakh' },
  { id: 'pangong-01', name: 'Pangong Tso', latitude: 33.7595, longitude: 78.6674, elevation: 4250, country: 'India', region: 'Ladakh' },
  { id: 'dbo-01', name: 'Daulat Beg Oldie', latitude: 35.4167, longitude: 77.9333, elevation: 5100, country: 'India', region: 'Ladakh' }
];

function fetchHttps(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'DEFOPS-Tactical-GIS/1.0' }, timeout: 6000 }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Open-Meteo HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            return reject(new Error(parsed.reason || 'Open-Meteo API returned error'));
          }
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Open-Meteo request timeout'));
    });
    req.on('error', reject);
  });
}

// 1. Dynamic Geocoding Search: Extracts dynamic Latitude & Longitude from Open-Meteo according to location name
router.get('/search', async (req, res) => {
  const { name } = req.query;
  if (!name || name.trim().length < 2) {
    return res.json({ results: [], source: 'OPEN_METEO' });
  }

  const cleanName = encodeURIComponent(name.trim());
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cleanName}&count=10&language=en&format=json`;

  try {
    const data = await fetchHttps(url);
    let results = (data.results || []).map(r => ({
      id: r.id || `${r.latitude}_${r.longitude}`,
      name: r.name,
      latitude: parseFloat(r.latitude.toFixed(5)),
      longitude: parseFloat(r.longitude.toFixed(5)),
      elevation: r.elevation ? Math.round(r.elevation) : null,
      country: r.country || r.country_code || '',
      region: r.admin1 || r.admin2 || '',
      timezone: r.timezone || 'UTC'
    }));

    // Prioritize results starting with the query, followed by Indian/theatre regions
    const q = name.trim().toLowerCase();
    results.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) ? 1 : 0;
      const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
      if (bStarts !== aStarts) return bStarts - aStarts;

      const aPriority = (a.country === 'India' || a.region?.toLowerCase().includes('ladakh') || a.region?.toLowerCase().includes('kashmir')) ? 1 : 0;
      const bPriority = (b.country === 'India' || b.region?.toLowerCase().includes('ladakh') || b.region?.toLowerCase().includes('kashmir')) ? 1 : 0;
      return bPriority - aPriority;
    });

    res.json({ results, source: 'OPEN_METEO_DYNAMIC' });
  } catch (err) {
    // Air-gapped / offline fallback filter
    const q = name.toLowerCase();
    const fallbackResults = AIRGAP_TACTICAL_REGISTRY.filter(item => 
      item.name.toLowerCase().includes(q) || item.region.toLowerCase().includes(q)
    );
    res.json({ 
      results: fallbackResults, 
      source: 'AIRGAP_OFFLINE_CACHE', 
      notice: 'Extracted from tactical cache (field zero-network mode)' 
    });
  }
});

// 2. Dynamic Weather & Meteorological Elevation at exact (lat, lng) from Open-Meteo
router.get('/weather', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and Longitude required' });
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code`;

  try {
    const data = await fetchHttps(url);
    if (!data || !data.current || data.current.temperature_2m === undefined) {
      throw new Error('Incomplete Open-Meteo payload');
    }
    const current = data.current;
    const weatherInfo = getWeatherDescription(current.weather_code);

    res.json({
      latitude: data.latitude,
      longitude: data.longitude,
      elevation: data.elevation ? Math.round(data.elevation) : 3200,
      current: {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        pressure: current.surface_pressure,
        weatherCode: current.weather_code,
        weatherLabel: weatherInfo.label,
        weatherIcon: weatherInfo.icon,
        condition: weatherInfo.condition,
        time: current.time
      },
      source: 'OPEN_METEO_LIVE'
    });
  } catch (err) {
    // Zero-network simulated ambient calculation based on altitude / coords
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const estElev = Math.round(3000 + Math.abs(latitude - 34) * 500);
    const estTemp = parseFloat((-5 - (estElev - 3000) * 0.006).toFixed(1));

    res.json({
      latitude,
      longitude,
      elevation: estElev,
      current: {
        temperature: estTemp,
        humidity: 45,
        windSpeed: 12.5,
        pressure: 680,
        weatherCode: 0,
        weatherLabel: 'High Altitude Clear',
        weatherIcon: '☀️',
        condition: 'OPTIMAL',
        time: new Date().toISOString()
      },
      source: 'AIRGAP_SIMULATED_ATMOSPHERE'
    });
  }
});

module.exports = router;
