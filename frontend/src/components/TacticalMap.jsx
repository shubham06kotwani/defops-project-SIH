import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Thermometer, 
  Battery, 
  Droplets, 
  Mountain, 
  Radio, 
  Crosshair, 
  Navigation, 
  Copy, 
  Check, 
  Box, 
  Compass, 
  X,
  Layers,
  Map as MapIcon,
  Wind,
  Gauge,
  Sparkles,
  CloudSun
} from 'lucide-react';

const STRATEGIC_CORRIDORS = [
  {
    name: 'NH-1D Axis (Srinagar - Dras - Kargil)',
    points: [
      [34.0837, 74.7973], // Srinagar
      [34.2800, 75.5000], // Zoji La Pass
      [34.4300, 75.7600], // Dras
      [34.5539, 76.1349]  // Kargil
    ],
    color: '#0284c7' // Tactical High-Vis Sky Blue
  },
  {
    name: 'Kargil - Leh Forward Line',
    points: [
      [34.5539, 76.1349], // Kargil
      [34.2980, 76.8290], // Lamayuru
      [34.1526, 77.5771]  // Leh
    ],
    color: '#16a34a' // Green Forward Line
  },
  {
    name: 'Leh - Khardung La - Siachen Base Axis',
    points: [
      [34.1526, 77.5771], // Leh
      [34.2787, 77.6047], // Khardung La
      [34.6150, 77.4600], // Diskit (Nubra Valley)
      [35.1970, 77.1700]  // Siachen Base Camp
    ],
    color: '#ea580c' // Tactical Orange Highway
  },
  {
    name: 'Darbuk - Shyok - DBO (Sub-Sector North Highway)',
    points: [
      [34.1526, 77.5771], // Leh
      [34.1167, 78.1333], // Karu
      [34.2500, 78.1833], // Chang La Pass
      [34.2667, 78.3333], // Tangste
      [34.7000, 78.1833], // Shyok
      [35.4167, 77.9333]  // Daulat Beg Oldie
    ],
    color: '#8b5cf6' // DS-DBO Strategic Axis
  }
];

// Strategic military locations in Northern Command
export const STRATEGIC_LOCATIONS = [
  { id: 'LEH', name: 'Leh Forward Depot & Airbase', lat: 34.1526, lng: 77.5771, elev: 3500, sector: 'NORTHERN_COMMAND' },
  { id: 'SIACHEN', name: 'Siachen Glacier Base Camp (Kumar Post Axis)', lat: 35.1970, lng: 77.1700, elev: 5400, sector: 'SIACHEN_SECTOR' },
  { id: 'KARGIL', name: 'Kargil Forward Line (121 Inf Bde)', lat: 34.5539, lng: 76.1349, elev: 4200, sector: 'KARGIL_SECTOR' },
  { id: 'DRAS', name: 'Dras Mountain Post (Tiger Hill Sector)', lat: 34.4300, lng: 75.7600, elev: 3300, sector: 'KARGIL_SECTOR' },
  { id: 'KHARDUNG_LA', name: 'Khardung La Pass (Gateway to Nubra - 17,582 ft)', lat: 34.2787, lng: 77.6047, elev: 5359, sector: 'SIACHEN_SECTOR' },
  { id: 'ZOJI_LA', name: 'Zoji La Pass (Western Supply Gate - 11,575 ft)', lat: 34.2800, lng: 75.5000, elev: 3528, sector: 'KARGIL_SECTOR' },
  { id: 'DBO', name: 'Daulat Beg Oldie (Sub-Sector North)', lat: 35.4167, lng: 77.9333, elev: 5100, sector: 'NORTHERN_COMMAND' },
  { id: 'PANGONG', name: 'Pangong Tso Forward Shore Base', lat: 33.7595, lng: 78.6674, elev: 4250, sector: 'NORTHERN_COMMAND' },
  { id: 'CHUSHUL', name: 'Chushul Strategic Garrison & Airstrip', lat: 33.5833, lng: 78.6500, elev: 4350, sector: 'NORTHERN_COMMAND' },
  { id: 'SRINAGAR', name: 'Srinagar 15 Corps Main Transit Base', lat: 34.0837, lng: 74.7973, elev: 1585, sector: 'NORTHERN_COMMAND' }
];

// Haversine distance calculator in KM
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return parseFloat((R * c).toFixed(1));
}

// Military Grid Reference approximation
export function computeMGRS(lat, lng) {
  const latBand = lat > 32 ? 'X' : 'W';
  const easting = Math.abs(Math.round((lng - 70) * 10000)).toString().slice(-4);
  const northing = Math.abs(Math.round((lat - 30) * 10000)).toString().slice(-4);
  return `43${latBand} LK ${easting} ${northing}`;
}

export default function TacticalMap({ 
  containers = [], 
  onSelectContainer, 
  onCreateRequisition, 
  apiBase = '',
  activeLocation,
  onSelectLocation 
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});
  const targetPinRef = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [mapMode, setMapMode] = useState('STREET'); // 'STREET' | 'SATELLITE' | 'TOPO' | 'OFFLINE'
  
  // Dynamic Open-Meteo Location Fetcher State
  const [manualTarget, setManualTarget] = useState(null);
  const [inputLat, setInputLat] = useState('34.1526');
  const [inputLng, setInputLng] = useState('77.5771');
  const [copied, setCopied] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [liveWeather, setLiveWeather] = useState(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // 1. Dynamic Open-Meteo Weather Fetcher for any coordinate
  const fetchOpenMeteoWeather = async (lat, lng) => {
    setIsWeatherLoading(true);
    try {
      // 1. Direct browser fetch to Open-Meteo (fast & never blocked by cloud server IP rate limits)
      const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code`;
      const resDirect = await fetch(directUrl);
      if (resDirect.ok) {
        const data = await resDirect.json();
        if (data && data.current && data.current.temperature_2m !== undefined) {
          const cur = data.current;
          const parsed = {
            latitude: data.latitude,
            longitude: data.longitude,
            elevation: data.elevation ? Math.round(data.elevation) : 3200,
            current: {
              temperature: cur.temperature_2m,
              humidity: cur.relative_humidity_2m,
              windSpeed: cur.wind_speed_10m,
              pressure: cur.surface_pressure,
              weatherCode: cur.weather_code,
              weatherLabel: cur.weather_code === 0 ? 'Clear Sky' : cur.weather_code < 4 ? 'Partly Cloudy' : cur.weather_code < 70 ? 'Rain' : 'Snowfall',
              weatherIcon: cur.weather_code === 0 ? '☀️' : cur.weather_code < 70 ? '🌧️' : '❄️',
              condition: cur.temperature_2m < -5 ? 'CRITICAL' : 'OPTIMAL'
            },
            source: 'OPEN_METEO_DIRECT'
          };
          setLiveWeather(parsed);
          return parsed;
        }
      }
      throw new Error('Direct fetch failed');
    } catch {
      // 2. Robust fallback to backend proxy route
      try {
        const res = await fetch(`${apiBase}/api/v1/location/weather?lat=${lat}&lng=${lng}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.current && data.current.temperature !== undefined) {
            setLiveWeather(data);
            return data;
          }
        }
      } catch (err2) {
        console.warn('Weather fallback failed:', err2);
      }
    } finally {
      setIsWeatherLoading(false);
    }
    return null;
  };

  // 2. Main Location Fetcher Function: Sets coordinates and extracts dynamic telemetry
  const fetchLocationCoordinates = async (lat, lng, label = null, elevation = null) => {
    const roundedLat = parseFloat(Number(lat).toFixed(5));
    const roundedLng = parseFloat(Number(lng).toFixed(5));
    
    setInputLat(roundedLat.toString());
    setInputLng(roundedLng.toString());

    // Find closest strategic base for distance context
    let closestLoc = STRATEGIC_LOCATIONS[0];
    let minDistance = 9999;
    STRATEGIC_LOCATIONS.forEach(loc => {
      const dist = getDistanceFromLatLonInKm(roundedLat, roundedLng, loc.lat, loc.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestLoc = loc;
      }
    });

    const resolvedName = label || (minDistance < 5 ? closestLoc.name : `Tactical Point (${minDistance} km from ${closestLoc.name.split(' (')[0]})`);
    const mgrs = computeMGRS(roundedLat, roundedLng);

    // Initial target data
    const targetData = {
      lat: roundedLat,
      lng: roundedLng,
      name: resolvedName,
      elevation: elevation || closestLoc.elev,
      closestBase: closestLoc.name.split(' (')[0],
      distanceKm: minDistance,
      mgrs: mgrs,
      sector: closestLoc.sector,
      source: 'OPEN_METEO_DYNAMIC'
    };

    setManualTarget(targetData);

    // Drop or reposition the tactical crosshair beacon
    if (mapRef.current) {
      if (targetPinRef.current) {
        mapRef.current.removeLayer(targetPinRef.current);
      }

      const targetIcon = L.divIcon({
        className: 'custom-target-marker',
        html: `
          <div style="position:relative; width:46px; height:46px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#ff6600; opacity:0.35; animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="width:34px; height:34px; border-radius:8px; background:#0b1118; border:2px solid #ff6600; display:flex; align-items:center; justify-content:center; color:#ff6600; font-size:16px; font-weight:bold; box-shadow:0 0 16px rgba(255,102,0,0.9);">
              📍
            </div>
          </div>
        `,
        iconSize: [46, 46],
        iconAnchor: [23, 23]
      });

      const pin = L.marker([roundedLat, roundedLng], { icon: targetIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
      
      pin.bindPopup(`
        <div style="font-family:'JetBrains Mono',monospace; padding:3px; min-width:200px;">
          <div style="font-size:10px; color:#ff6600; font-weight:bold; letter-spacing:0.05em;">OPEN-METEO DYNAMIC TARGET</div>
          <div style="font-size:12px; font-weight:bold; color:#ffffff; margin-top:2px;">${resolvedName}</div>
          <div style="font-size:11px; color:#38bdf8; margin-top:4px;">${roundedLat}°N, ${roundedLng}°E</div>
          <div style="font-size:10px; color:#d4b483; margin-top:2px;">MGRS: ${mgrs}</div>
          <div style="font-size:10px; color:#9ca3af; margin-top:2px;">${minDistance}km from ${closestLoc.name.split(' (')[0]}</div>
        </div>
      `).openPopup();

      targetPinRef.current = pin;
    }

    // Dynamic extraction of live weather and elevation from Open-Meteo
    const weatherData = await fetchOpenMeteoWeather(roundedLat, roundedLng);
    const finalElev = weatherData?.elevation || targetData.elevation;
    const finalWeather = weatherData?.current || null;

    const resolvedFullTarget = {
      ...targetData,
      elevation: finalElev,
      liveWeather: finalWeather
    };

    setManualTarget(resolvedFullTarget);

    if (onSelectLocation) {
      onSelectLocation(resolvedFullTarget);
    }
  };

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [34.35, 76.95],
        zoom: 8,
        minZoom: 6,
        maxZoom: 18,
        zoomControl: true
      });

      // Supply Corridors with clean glowing line
      STRATEGIC_CORRIDORS.forEach(route => {
        L.polyline(route.points, {
          color: route.color,
          weight: 4.5,
          opacity: 0.9,
          dashArray: '8, 8'
        }).addTo(map).bindTooltip(
          `<div style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:bold; color:#d4b483; background:#0d121a; padding:4px 8px; border:1px solid ${route.color}; border-radius:4px; box-shadow:0 0 10px rgba(0,0,0,0.6);">${route.name}</div>`, 
          { sticky: true }
        );
      });

      // Strategic Passes & Landmarks
      STRATEGIC_LOCATIONS.forEach(loc => {
        const passIcon = L.divIcon({
          className: 'tactical-strategic-pin',
          html: `<div style="background:#0f1722; color:#d4b483; font-family:'JetBrains Mono',monospace; font-weight:bold; font-size:10px; padding:3px 8px; border-radius:4px; border:1px solid #d4b483; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.5); cursor:pointer;">⛰️ ${loc.name.split(' (')[0]}</div>`,
          iconSize: [130, 24],
          iconAnchor: [65, 12]
        });
        
        const m = L.marker([loc.lat, loc.lng], { icon: passIcon }).addTo(map);
        m.on('click', () => {
          fetchLocationCoordinates(loc.lat, loc.lng, loc.name, loc.elev);
        });
      });

      // INTERACTIVE CLICK LOCATION FETCHER: Click anywhere on map to fetch desired location dynamically from Open-Meteo
      map.on('click', (e) => {
        fetchLocationCoordinates(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      
      // Auto-fetch default initial location telemetry (Leh HQ) from Open-Meteo
      fetchLocationCoordinates(34.1526, 77.5771, 'Leh Forward Depot & Airbase', 3500);
    }
  }, []);

  // Fly camera to manual target coordinates
  const handleGoToCoords = (e) => {
    if (e) e.preventDefault();
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      fetchLocationCoordinates(lat, lng, `Manual Coordinates (${lat}°N, ${lng}°E)`);
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 11, { duration: 1.2 });
      }
    }
  };

  // GPS User Location Fetcher
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your device browser.');
      return;
    }

    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        const { latitude, longitude } = pos.coords;
        fetchLocationCoordinates(latitude, longitude, 'Device GPS Tactical Telemetry');
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 12, { duration: 1.5 });
        }
      },
      () => {
        setGeoLocating(false);
        // Fallback to Northern Command center if permission denied
        fetchLocationCoordinates(34.1526, 77.5771, 'Northern Command Leh HQ (Fallback)');
        if (mapRef.current) {
          mapRef.current.flyTo([34.1526, 77.5771], 11, { duration: 1.2 });
        }
      },
      { timeout: 7000 }
    );
  };

  // Copy coordinates to clipboard
  const handleCopyCoords = () => {
    if (!manualTarget) return;
    const text = `${manualTarget.lat}°N, ${manualTarget.lng}°E (MGRS: ${manualTarget.mgrs})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear manual target pin
  const handleClearPin = () => {
    if (targetPinRef.current && mapRef.current) {
      mapRef.current.removeLayer(targetPinRef.current);
      targetPinRef.current = null;
    }
    setManualTarget(null);
  };

  // 3. Tile Layer Switcher: Real Map Tiles (OpenStreetMap, Esri Satellite, Topo, or Offline Canvas)
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    let layer;

    if (mapMode === 'STREET') {
      // 🗺️ Standard Crisp OpenStreetMap - True Geographic Map
      layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &bull; Indian Army GIS Theatre'
      });
    } else if (mapMode === 'SATELLITE') {
      // 🛰️ High-Resolution Satellite Imagery (Esri World Imagery)
      layer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: '&copy; Esri World Imagery &bull; Tactical Recon Satellite'
      });
    } else if (mapMode === 'TOPO') {
      // ⛰️ Topographic Elevation & Contour Map
      layer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: '&copy; Esri Topo &bull; High-Altitude Alpine Contours'
      });
    } else {
      // 🎯 100% Offline Tactical C4ISR Canvas Grid (Zero Area Network)
      const Grid = L.GridLayer.extend({
        createTile: function (coords) {
          const tile = document.createElement('canvas');
          const size = this.getTileSize();
          tile.width = size.x;
          tile.height = size.y;
          const ctx = tile.getContext('2d');

          ctx.fillStyle = '#0a1017';
          ctx.fillRect(0, 0, size.x, size.y);

          ctx.strokeStyle = '#14202e';
          ctx.lineWidth = 1;
          ctx.beginPath();
          const step = size.x / 4;
          for (let i = 0; i <= size.x; i += step) {
            ctx.moveTo(i, 0); ctx.lineTo(i, size.y);
            ctx.moveTo(0, i); ctx.lineTo(size.x, i);
          }
          ctx.stroke();

          ctx.fillStyle = '#1c3046';
          ctx.font = '9px monospace';
          ctx.fillText(`MGRS 43X [Z${coords.z}]`, 8, 14);

          return tile;
        }
      });

      layer = new Grid({
        attribution: 'DEFOPS C4ISR Air-Gapped Grid &bull; 100% Zero-Network'
      });
    }

    layer.on('tileerror', () => {});
    layer.addTo(mapRef.current);
    tileLayerRef.current = layer;
  }, [mapMode]);

  // 4. Update Convoy Markers on Map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const getMarkerMeta = (status) => {
      switch (status) {
        case 'COLD_CHAIN_BREACH':
          return { color: '#ef4444', icon: '🔥', isAlert: true };
        case 'FREEZING_BREACH':
          return { color: '#0284c7', icon: '❄️', isAlert: true };
        case 'TAMPERED':
          return { color: '#f59e0b', icon: '⚠️', isAlert: true };
        case 'BATTERY_CRITICAL':
          return { color: '#ea580c', icon: '🪫', isAlert: true };
        case 'HUMIDITY_EXCESS':
          return { color: '#6366f1', icon: '💧', isAlert: true };
        default:
          return { color: '#10b981', icon: '🚚', isAlert: false };
      }
    };

    containers.forEach(container => {
      if (!container.location || !container.location.coordinates) return;
      const [lng, lat] = container.location.coordinates;
      const meta = getMarkerMeta(container.status);

      const customIcon = L.divIcon({
        className: 'custom-convoy-marker',
        html: `
          <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${meta.color}; opacity:0.4; animation:${meta.isAlert ? 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite' : 'none'};"></div>
            <div style="width:30px; height:30px; border-radius:8px; background:#0b1118; border:2px solid ${meta.color}; display:flex; align-items:center; justify-content:center; color:${meta.color}; font-size:13px; font-weight:bold; box-shadow:0 0 14px ${meta.color};">
              ${meta.icon}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      if (markersRef.current[container.containerId]) {
        markersRef.current[container.containerId].setLatLng([lat, lng]);
        markersRef.current[container.containerId].setIcon(customIcon);
      } else {
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedNode(container);
          if (onSelectContainer) onSelectContainer(container);
        });

        marker.bindPopup(`
          <div style="padding:4px; font-family:'JetBrains Mono',monospace;">
            <div style="font-weight:bold; font-size:13px; color:#d4b483; letter-spacing:0.05em;">${container.containerId}</div>
            <div style="font-size:11px; color:#9ca3af; margin-bottom:4px;">${container.baseName || 'Convoy Transit'}</div>
            <div style="font-size:11px; color:${meta.color}; font-weight:bold;">
              STATUS: ${container.status}
            </div>
            <div style="font-size:10px; color:#d1d5db; margin-top:3px; border-top:1px solid #27384e; padding-top:3px;">
              TEMP: <strong style="color:${meta.color}">${container.sensors?.temperature ?? '--'}°C</strong> | BAT: <strong>${container.sensors?.battery ?? '--'}%</strong>
            </div>
          </div>
        `);

        markersRef.current[container.containerId] = marker;
      }
    });
  }, [containers]);

  return (
    <div className="space-y-4">
      {/* DYNAMIC OPEN-METEO LOCATION FETCHER & GEOGRAPHIC TARGETING CONSOLE */}
      <div className="bg-white border border-[#c8ddcf] rounded-lg p-4 shadow-xs hud-corner-brackets">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <Crosshair className="text-[#ff6600]" size={18} />
            <h3 className="font-stencil font-bold text-sm text-gray-900 tracking-wider uppercase">
              OPEN-METEO DYNAMIC LOCATION FETCHER &bull; GEOGRAPHIC TARGETING
            </h3>
            <span className="bg-[#1c3824] text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e655] animate-ping"></span>
              DYNAMIC COORDINATE EXTRACTION ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGetDeviceLocation}
              disabled={geoLocating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#f0f5f1] hover:bg-[#e2ece5] text-[#1c3824] border border-[#c8ddcf] text-xs font-mono font-bold transition-all cursor-pointer"
              title="Fetch current physical device GPS location"
            >
              <Compass size={13} className={geoLocating ? 'animate-spin text-[#ff6600]' : ''} />
              <span>{geoLocating ? 'LOCATING GPS...' : 'ACQUIRE MY GPS'}</span>
            </button>
          </div>
        </div>

        {/* 1. Quick Strategic Preset Dropdown & Direct Coordinate Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Preset Selector */}
          <div>
            <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
              Strategic Forward Outposts:
            </label>
            <select
              onChange={(e) => {
                const match = STRATEGIC_LOCATIONS.find(l => l.id === e.target.value);
                if (match) {
                  fetchLocationCoordinates(match.lat, match.lng, match.name, match.elev);
                  if (mapRef.current) {
                    mapRef.current.flyTo([match.lat, match.lng], 11, { duration: 1.2 });
                  }
                }
              }}
              defaultValue=""
              className="w-full bg-[#f8faf8] border border-[#c8ddcf] text-gray-800 rounded p-2 text-xs font-mono outline-none focus:border-[#ff6600]"
            >
              <option value="" disabled>-- Select Strategic Post --</option>
              {STRATEGIC_LOCATIONS.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.elev}m)
                </option>
              ))}
            </select>
          </div>

          {/* Manual Coordinate Inputs with Dynamic Open-Meteo Weather Fetching */}
          <form onSubmit={handleGoToCoords} className="md:col-span-2 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                Dynamic Latitude (°N):
              </label>
              <input
                type="text"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                placeholder="34.1526"
                className="w-full bg-[#f8faf8] border border-[#c8ddcf] text-gray-800 rounded p-2 text-xs font-mono outline-none focus:border-[#ff6600]"
              />
            </div>

            <div className="flex-1 min-w-[120px]">
              <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                Dynamic Longitude (°E):
              </label>
              <input
                type="text"
                value={inputLng}
                onChange={(e) => setInputLng(e.target.value)}
                placeholder="77.5771"
                className="w-full bg-[#f8faf8] border border-[#c8ddcf] text-gray-800 rounded p-2 text-xs font-mono outline-none focus:border-[#ff6600]"
              />
            </div>

            <button
              type="submit"
              className="bg-[#1c3824] hover:bg-[#284f33] text-white font-stencil font-bold text-xs tracking-wider px-4 py-2 rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Navigation size={13} />
              <span>FLY &amp; QUERY OPEN-METEO</span>
            </button>
          </form>
        </div>

        {/* 2. DYNAMIC OPEN-METEO TARGET ACQUIRED HUD CARD */}
        {manualTarget && (
          <div className="mt-3 p-3.5 bg-[#f0f6f2] border border-[#c2dcd0] rounded-lg text-xs font-mono">
            {/* Top Bar of Target Card */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#c2dcd0]/80">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-stencil font-bold text-sm text-[#1c3824]">
                      {manualTarget.name}
                    </span>
                    <span className="bg-[#1c3824] text-[#00e655] text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      OPEN-METEO SYNCED
                    </span>
                  </div>
                  <div className="text-gray-700 flex flex-wrap items-center gap-3 text-[11px] mt-0.5">
                    <span className="text-sky-800 font-bold">
                      LAT: <strong>{manualTarget.lat}°N</strong> &bull; LNG: <strong>{manualTarget.lng}°E</strong>
                    </span>
                    <span>&bull;</span>
                    <span>MGRS: <strong>{manualTarget.mgrs}</strong></span>
                    <span>&bull;</span>
                    <span className="text-amber-800 font-bold">
                      ELEVATION: <strong>{manualTarget.elevation}m</strong>
                    </span>
                    <span>&bull;</span>
                    <span className="text-gray-600">
                      Distance: <strong>{manualTarget.distanceKm} km from {manualTarget.closestBase}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="px-2.5 py-1.5 rounded bg-white hover:bg-gray-100 text-gray-800 border border-[#c8ddcf] text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Copy dynamic coordinates to clipboard"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'COPIED' : 'COPY GPS'}</span>
                </button>

                {onCreateRequisition && (
                  <button
                    type="button"
                    onClick={() => onCreateRequisition('AMMUNITION', 500, manualTarget)}
                    className="px-3 py-1.5 rounded bg-[#ff6600] hover:bg-[#e65100] text-white text-[11px] font-stencil font-bold tracking-wider flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <Box size={12} />
                    <span>DISPATCH SUPPLY HERE</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearPin}
                  className="p-1.5 rounded bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 border border-[#c8ddcf] transition-all cursor-pointer"
                  title="Remove pinpoint"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Live Meteorological Data Telemetry Panel (Extracted from Open-Meteo) */}
            <div className="mt-2.5 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              {/* Temperature */}
              <div className="bg-white p-2.5 rounded border border-[#c8ddcf] flex items-center gap-2.5 shadow-2xs">
                <div className={`p-1.5 rounded ${
                  (liveWeather?.current?.temperature ?? 0) < 0 
                    ? 'bg-sky-50 text-sky-600' 
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  <Thermometer size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-stencil font-bold uppercase">AMBIENT TEMP</div>
                  <div className="font-bold text-gray-900 text-sm">
                    {isWeatherLoading ? (
                      <span className="text-gray-400 text-xs">Querying...</span>
                    ) : (
                      `${liveWeather?.current?.temperature ?? '--'} °C`
                    )}
                  </div>
                </div>
              </div>

              {/* Weather Condition */}
              <div className="bg-white p-2.5 rounded border border-[#c8ddcf] flex items-center gap-2.5 shadow-2xs">
                <div className="p-1.5 rounded bg-emerald-50 text-emerald-600">
                  <CloudSun size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-stencil font-bold uppercase">ATMOSPHERE</div>
                  <div className="font-bold text-gray-900 text-xs truncate max-w-[130px]" title={liveWeather?.current?.weatherLabel || 'Clear'}>
                    {isWeatherLoading ? (
                      <span className="text-gray-400 text-xs">Updating...</span>
                    ) : (
                      `${liveWeather?.current?.weatherIcon || '☀️'} ${liveWeather?.current?.weatherLabel || 'Nominal'}`
                    )}
                  </div>
                </div>
              </div>

              {/* Relative Humidity */}
              <div className="bg-white p-2.5 rounded border border-[#c8ddcf] flex items-center gap-2.5 shadow-2xs">
                <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                  <Droplets size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-stencil font-bold uppercase">HUMIDITY</div>
                  <div className="font-bold text-gray-900 text-sm">
                    {isWeatherLoading ? (
                      <span className="text-gray-400 text-xs">...</span>
                    ) : (
                      `${liveWeather?.current?.humidity ?? '--'} %`
                    )}
                  </div>
                </div>
              </div>

              {/* Wind Speed & Pressure */}
              <div className="bg-white p-2.5 rounded border border-[#c8ddcf] flex items-center gap-2.5 shadow-2xs">
                <div className="p-1.5 rounded bg-purple-50 text-purple-600">
                  <Wind size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-stencil font-bold uppercase">WIND / PRESSURE</div>
                  <div className="font-bold text-gray-900 text-xs">
                    {isWeatherLoading ? (
                      <span className="text-gray-400 text-xs">...</span>
                    ) : (
                      `${liveWeather?.current?.windSpeed ?? '--'} km/h | ${liveWeather?.current?.pressure ? Math.round(liveWeather.current.pressure) : '--'} hPa`
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Map Card */}
      <div className="bg-[#0b1017] border border-[#1e2a3c] rounded-lg overflow-hidden shadow-2xl relative hud-corner-brackets">
        
        {/* Header HUD Bar */}
        <div className="px-4 py-2.5 bg-[#0e141e] border-b border-[#1c2738] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Radio className="text-[#00e655] animate-pulse" size={16} />
            <h2 className="font-stencil font-bold text-base text-white tracking-wider flex items-center gap-2">
              <span>GIS LOGISTICS THEATRE</span>
              <span className="text-gray-400 font-sans text-xs font-normal">Northern Command &bull; Ladakh &bull; Siachen</span>
            </h2>
          </div>
          
          {/* True Geographic Map Layer Switcher */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-gray-400 text-[11px] hidden sm:inline flex items-center gap-1">
              <Layers size={12} /> STYLE:
            </span>
            <div className="flex bg-[#080d14] rounded p-0.5 border border-[#1e2b3c]">
              <button
                type="button"
                onClick={() => setMapMode('STREET')}
                className={`px-2.5 py-1 rounded text-[11px] font-stencil font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  mapMode === 'STREET'
                    ? 'bg-[#1b3d22] text-[#00e655] border border-[#00e655]/40 shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="True OpenStreetMap Geographic View with Roads, Towns, and Passes"
              >
                <MapIcon size={11} />
                <span>🗺️ STANDARD MAP</span>
              </button>

              <button
                type="button"
                onClick={() => setMapMode('SATELLITE')}
                className={`px-2.5 py-1 rounded text-[11px] font-stencil font-bold tracking-wider transition-all cursor-pointer ${
                  mapMode === 'SATELLITE'
                    ? 'bg-[#ff6600] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="High-Resolution Satellite Recon Imagery"
              >
                🛰️ SATELLITE
              </button>

              <button
                type="button"
                onClick={() => setMapMode('TOPO')}
                className={`px-2.5 py-1 rounded text-[11px] font-stencil font-bold tracking-wider transition-all cursor-pointer ${
                  mapMode === 'TOPO'
                    ? 'bg-[#d4b483] text-[#101722] font-bold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Topographic Elevation & Mountain Contours"
              >
                ⛰️ TOPO RELIEF
              </button>

              <button
                type="button"
                onClick={() => setMapMode('OFFLINE')}
                className={`px-2.5 py-1 rounded text-[11px] font-stencil font-bold tracking-wider transition-all cursor-pointer ${
                  mapMode === 'OFFLINE'
                    ? 'bg-sky-900 text-sky-200 border border-sky-400/40 shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="100% Offline Procedural Grid (Zero Area Network)"
              >
                🎯 ZERO-NET GRID
              </button>
            </div>
          </div>
        </div>

        {/* Leaflet Map Div with True Natural Rendering */}
        <div className="relative overflow-hidden">
          <div 
            ref={mapContainerRef} 
            className="w-full h-[540px] z-10 real-gis-map"
          ></div>

          {/* HUD Crosshairs in Corners */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none text-gray-800 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-gray-300 shadow-xs">
            LAT 34°27'N &bull; LON 77°35'E
          </div>

          <div className="absolute bottom-3 left-3 z-20 pointer-events-none bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded text-gray-800 font-mono text-[11px] font-bold border border-gray-300 shadow-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse"></span>
            <span>GIS RECON: ACTIVE &bull; CLICK ANYWHERE TO PINPOINT</span>
          </div>
        </div>
      </div>

      {/* Selected Convoy Telemetry Details Box */}
      {selectedNode && (
        <div className="bg-[#0c1119] border border-[#1e2a3c] rounded-lg p-5 shadow-2xl hud-corner-brackets">
          <div className="flex items-center justify-between mb-4 border-b border-[#1b2636] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[#182332] text-[#ff6600] border border-[#27384e]">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-stencil font-bold text-lg text-white tracking-wide">
                  {selectedNode.containerId} &bull; <span className="text-gray-400 font-sans text-xs font-normal">{selectedNode.baseName || 'In Transit'}</span>
                </h3>
                <p className="text-xs text-[#d4b483] font-mono">
                  COORDS: {selectedNode.location?.coordinates ? `${selectedNode.location.coordinates[1].toFixed(4)}°N, ${selectedNode.location.coordinates[0].toFixed(4)}°E` : 'GPS FIX ACTIVE'}
                </p>
              </div>
            </div>
            {(() => {
              const s = selectedNode.status;
              let badgeCls = 'bg-[#122316] text-[#00e655] border-[#1b3d22]';
              let badgeText = s;
              if (s === 'COLD_CHAIN_BREACH') {
                badgeCls = 'bg-red-950/80 text-red-400 border-red-800 animate-pulse';
                badgeText = '🔥 HEAT EXCEEDANCE (>25°C)';
              } else if (s === 'FREEZING_BREACH') {
                badgeCls = 'bg-sky-950/80 text-sky-400 border-sky-800 animate-pulse';
                badgeText = '❄️ SUB-ZERO FREEZE (<-10°C)';
              } else if (s === 'TAMPERED') {
                badgeCls = 'bg-amber-950/80 text-amber-400 border-amber-800 animate-pulse';
                badgeText = '⚠️ DOOR SEAL BREACHED';
              } else if (s === 'BATTERY_CRITICAL') {
                badgeCls = 'bg-orange-950/80 text-orange-400 border-orange-800 animate-pulse';
                badgeText = '🪫 BATTERY CRITICAL (<=20%)';
              } else if (s === 'HUMIDITY_EXCESS') {
                badgeCls = 'bg-indigo-950/80 text-indigo-400 border-indigo-800 animate-pulse';
                badgeText = '💧 HIGH CONDENSATION (>=75%)';
              }

              return (
                <span className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider border ${badgeCls}`}>
                  {badgeText}
                </span>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Core Temp */}
            <div className="bg-[#101722] p-3.5 rounded border border-[#1d2b3e]">
              <div className="flex items-center gap-1.5 text-[#d4b483] mb-1 font-stencil font-bold uppercase tracking-wider">
                <Thermometer size={14} className={
                  selectedNode.sensors?.temperature > 25 
                    ? 'text-red-500 animate-pulse' 
                    : selectedNode.sensors?.temperature < -10 
                    ? 'text-sky-400 animate-pulse' 
                    : 'text-[#ff6600]'
                } />
                <span>CORE TEMP</span>
              </div>
              <div className={`font-mono text-xl font-bold ${
                selectedNode.sensors?.temperature > 25 
                  ? 'text-red-500' 
                  : selectedNode.sensors?.temperature < -10 
                  ? 'text-sky-400' 
                  : 'text-white'
              }`}>
                {selectedNode.sensors?.temperature ?? '--'}°C
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {selectedNode.sensors?.temperature > 25 
                  ? 'HEAT ALARM: > 25.0°C' 
                  : selectedNode.sensors?.temperature < -10 
                  ? 'FREEZE ALARM: < -10°C' 
                  : 'THERMAL BUFFER: NORMAL'}
              </span>
            </div>

            {/* Sealed Humidity */}
            <div className="bg-[#101722] p-3.5 rounded border border-[#1d2b3e]">
              <div className="flex items-center gap-1.5 text-[#d4b483] mb-1 font-stencil font-bold uppercase tracking-wider">
                <Droplets size={14} className={(selectedNode.sensors?.humidity ?? 0) >= 75 ? 'text-indigo-400 animate-pulse' : 'text-sky-400'} />
                <span>HUMIDITY</span>
              </div>
              <div className={`font-mono text-xl font-bold ${(selectedNode.sensors?.humidity ?? 0) >= 75 ? 'text-indigo-400' : 'text-white'}`}>
                {selectedNode.sensors?.humidity ?? '--'}%
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {(selectedNode.sensors?.humidity ?? 0) >= 75 ? 'CONDENSATION EXCEEDANCE' : 'SEAL INTEGRITY: NOMINAL'}
              </span>
            </div>

            {/* Solar Battery */}
            <div className="bg-[#101722] p-3.5 rounded border border-[#1d2b3e]">
              <div className="flex items-center gap-1.5 text-[#d4b483] mb-1 font-stencil font-bold uppercase tracking-wider">
                <Battery size={14} className={(selectedNode.sensors?.battery ?? 0) <= 20 ? 'text-orange-400 animate-pulse' : 'text-[#00e655]'} />
                <span>BATTERY</span>
              </div>
              <div className={`font-mono text-xl font-bold ${(selectedNode.sensors?.battery ?? 0) <= 20 ? 'text-orange-400' : 'text-white'}`}>
                {selectedNode.sensors?.battery ?? '--'}%
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {(selectedNode.sensors?.battery ?? 0) <= 20 ? 'LOW POWER WARNING' : 'SOLAR BUFFER: 48H RESERVE'}
              </span>
            </div>

            {/* Door Seal & Corridor */}
            <div className="bg-[#101722] p-3.5 rounded border border-[#1d2b3e]">
              <div className="flex items-center gap-1.5 text-[#d4b483] mb-1 font-stencil font-bold uppercase tracking-wider">
                <Mountain size={14} className="text-[#d4b483]" />
                <span>DOOR SEAL &amp; AXIS</span>
              </div>
              <div className={`font-mono text-sm font-bold mt-1 ${
                selectedNode.sensors?.tamper || selectedNode.status === 'TAMPERED' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {selectedNode.sensors?.tamper || selectedNode.status === 'TAMPERED' ? '⚠️ SEAL BROKEN' : '🔒 SEAL INTACT'}
              </div>
              <span className="text-[10px] text-gray-500 font-mono">HIGH-ALTITUDE CONVOY</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
