/**
 * P-LFSCS: Tactical GIS Logistics & Convoy Tracking Map
 * Powered by Leaflet.js with Custom Military HUD Cartography
 */

let mapInstance = null;
let containerMarkers = {};
let routeCorridors = [];

// Strategic Corridors in Northern Command (Coordinates: [lat, lng])
const STRATEGIC_ROUTES = [
  {
    name: 'Srinagar - Dras - Kargil Axis (NH-1D)',
    points: [
      [34.0837, 74.7973], // Srinagar 15 Corps HQ
      [34.2800, 75.5000], // Zoji La Pass
      [34.4300, 75.7600], // Dras
      [34.5539, 76.1349]  // Kargil Transit Hub
    ],
    color: '#06b6d4',
    status: 'ACTIVE - SNOW CAUTION'
  },
  {
    name: 'Kargil - Leh Forward Supply Line',
    points: [
      [34.5539, 76.1349], // Kargil
      [34.2980, 76.8290], // Lamayuru
      [34.1526, 77.5771]  // Leh Forward Depot
    ],
    color: '#10b981',
    status: 'OPEN ALL TRAFFIC'
  },
  {
    name: 'Leh - Khardung La - Siachen Sector Axis',
    points: [
      [34.1526, 77.5771], // Leh
      [34.2787, 77.6047], // Khardung La Pass
      [34.6150, 77.4600], // Diskit Nubra
      [35.1970, 77.1700]  // Siachen Base Camp
    ],
    color: '#f59e0b',
    status: 'RESTRICTED HIGH-ALTITUDE CONVOY'
  }
];

const PASS_NODES = [
  { name: 'Zoji La Pass', lat: 34.2800, lng: 75.5000, elev: '11,575 ft', state: 'caution' },
  { name: 'Khardung La Pass', lat: 34.2787, lng: 77.6047, elev: '17,582 ft', state: 'open' },
  { name: 'Chang La Pass', lat: 34.0500, lng: 77.9300, elev: '17,688 ft', state: 'caution' }
];

function initGISMap(containers) {
  const mapElement = document.getElementById('tactical-map');
  if (!mapElement || typeof L === 'undefined') return;

  // Initialize Leaflet Map centered over Ladakh / Northern Command
  mapInstance = L.map('tactical-map', {
    center: [34.45, 76.85],
    zoom: 8,
    minZoom: 6,
    maxZoom: 13,
    zoomControl: false
  });

  // Zoom control in top right
  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  // High contrast tactical dark tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; Indian Army P-LFSCS GIS &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance);

  // Draw Strategic Supply Corridors
  STRATEGIC_ROUTES.forEach(route => {
    const polyline = L.polyline(route.points, {
      color: route.color,
      weight: 3.5,
      opacity: 0.75,
      dashArray: '8, 8'
    }).addTo(mapInstance);

    polyline.bindTooltip(`<strong>${route.name}</strong><br>Status: ${route.status}`, {
      sticky: true,
      className: 'tactical-tooltip'
    });
  });

  // Plot Mountain Passes
  PASS_NODES.forEach(pass => {
    const passIcon = L.divIcon({
      className: 'pass-marker',
      html: `
        <div style="
          width: 14px; 
          height: 14px; 
          background: #f59e0b; 
          border: 2px solid #fff; 
          border-radius: 2px;
          transform: rotate(45deg);
          box-shadow: 0 0 8px #f59e0b;
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    L.marker([pass.lat, pass.lng], { icon: passIcon })
      .addTo(mapInstance)
      .bindPopup(`
        <div style="font-family: var(--font-tactical); font-size: 1rem;">
          <h4 style="color: #f59e0b; margin-bottom: 2px;">⛰️ ${pass.name}</h4>
          <p style="font-size: 0.8rem; color: #aaa;">Elevation: <strong>${pass.elev}</strong></p>
          <p style="font-size: 0.75rem; color: #10b981;">Convoy Protocol: Chained Wheels / Anti-Freeze</p>
        </div>
      `);
  });

  // Plot Initial Containers
  containers.forEach(container => {
    plotContainerMarker(container);
  });

  // Select first container for drawer inspection
  if (containers.length > 0) {
    inspectNode(containers[0]);
  }

  window.TacticalMap = mapInstance;
}

function plotContainerMarker(container) {
  if (!mapInstance || !container.location || !container.location.coordinates) return;

  const [lng, lat] = container.location.coordinates;
  const isBreach = container.status === 'COLD_CHAIN_BREACH';
  const pulseColor = isBreach ? '#ef4444' : '#10b981';

  const customIcon = L.divIcon({
    className: `tactical-convoy-icon ${container.containerId}`,
    html: `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="
          position: absolute; 
          top: 0; 
          left: 0; 
          width: 34px; 
          height: 34px; 
          border-radius: 50%; 
          background: ${pulseColor}; 
          opacity: 0.35;
          animation: ${isBreach ? 'alertPulse 0.9s infinite' : 'pulse 2s infinite'};
        "></div>
        <div style="
          position: absolute; 
          top: 6px; 
          left: 6px; 
          width: 22px; 
          height: 22px; 
          border-radius: 50%; 
          background: #0a110d; 
          border: 2px solid ${pulseColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #fff;
          font-family: var(--font-tactical);
          font-weight: 700;
          box-shadow: 0 0 10px ${pulseColor};
        ">
          ${isBreach ? '!' : '🚚'}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  if (containerMarkers[container.containerId]) {
    containerMarkers[container.containerId].setLatLng([lat, lng]);
    containerMarkers[container.containerId].setIcon(customIcon);
  } else {
    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);
    
    marker.on('click', () => {
      inspectNode(container);
      AudioFX.playBeep(1100, 0.05);
    });

    marker.bindPopup(`
      <div style="font-family: var(--font-tactical); font-size: 1rem; min-width: 170px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color: #fff;">${container.containerId}</strong>
          <span style="font-size:0.7rem; color: ${isBreach ? '#ef4444' : '#10b981'}; font-weight:700;">
            ${container.status}
          </span>
        </div>
        <div style="font-size: 0.8rem; color: #bbb; margin-top: 4px;">
          Base: <strong>${container.baseName || 'In Transit'}</strong><br>
          Temp: <strong style="color: ${isBreach ? '#ef4444' : '#10b981'};">${container.sensors?.temperature ?? '--'}°C</strong><br>
          Battery: <strong>${container.sensors?.battery ?? '--'}%</strong>
        </div>
      </div>
    `);

    containerMarkers[container.containerId] = marker;
  }
}

function updateMapContainer(container) {
  plotContainerMarker(container);
  if (AppState.selectedContainerId === container.containerId) {
    inspectNode(container);
  }
}

function inspectNode(container) {
  AppState.selectedContainerId = container.containerId;
  const drawer = document.getElementById('selected-node-drawer');
  if (!drawer) return;

  const isBreach = container.status === 'COLD_CHAIN_BREACH';
  const temp = container.sensors?.temperature ?? 0;
  const humidity = container.sensors?.humidity ?? 0;
  const battery = container.sensors?.battery ?? 0;
  const [lng, lat] = container.location?.coordinates || [77.5771, 34.1526];

  let tempClass = 'val-temp-normal';
  if (temp > 25.0) tempClass = 'temp-danger';
  else if (temp < 0) tempClass = 'temp-cold';

  drawer.innerHTML = `
    <div class="node-card highlight">
      <div class="node-title-row">
        <div>
          <span class="node-id">${container.containerId}</span>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${container.baseName || 'Forward Convoy'}</div>
        </div>
        <span class="telemetry-pill ${isBreach ? 'status-breach' : 'status-normal'}">
          ${container.status}
        </span>
      </div>

      <div class="node-stats-grid">
        <div class="node-stat-box">
          <span class="s-label">TEMPERATURE</span>
          <span class="s-val ${tempClass}">${temp}°C</span>
        </div>
        <div class="node-stat-box">
          <span class="s-label">BATTERY</span>
          <span class="s-val" style="color: ${battery < 30 ? 'var(--accent-amber)' : 'var(--accent-cyan)'};">${battery}%</span>
        </div>
        <div class="node-stat-box">
          <span class="s-label">HUMIDITY</span>
          <span class="s-val">${humidity}%</span>
        </div>
        <div class="node-stat-box">
          <span class="s-label">SATELLITE FIX</span>
          <span class="s-val" style="font-size:0.75rem;">${lat.toFixed(4)}N, ${lng.toFixed(4)}E</span>
        </div>
      </div>

      <div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
        Last Telemetry Heartbeat: <strong style="color: var(--text-primary);">${new Date(container.updatedAt || Date.now()).toLocaleTimeString()}</strong>
      </div>

      <button class="btn-hud btn-primary" onclick="loadContainerIntoSimulator('${container.containerId}')" style="margin-top: 0.25rem;">
        ⚡ INJECT TELEMETRY PACKET
      </button>
    </div>
  `;
}

// Global Exports
window.initGISMap = initGISMap;
window.updateMapContainer = updateMapContainer;
window.inspectNode = inspectNode;
