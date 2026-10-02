/**
 * P-LFSCS: IoT Telemetry & Convoy Tracking + Live Packet Injector
 */

function renderContainersGrid() {
  const container = document.getElementById('containers-grid-list');
  if (!container) return;

  const list = AppState.containers || [];
  if (list.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); padding: 1rem;">No telemetry containers active.</div>';
    return;
  }

  container.innerHTML = list.map(c => {
    const isBreach = c.status === 'COLD_CHAIN_BREACH';
    const temp = c.sensors?.temperature ?? 0;
    const humidity = c.sensors?.humidity ?? 0;
    const battery = c.sensors?.battery ?? 0;
    const [lng, lat] = c.location?.coordinates || [0, 0];

    let tempClass = 'val-temp-normal';
    if (temp > 25.0) tempClass = 'val-temp-breach';

    return `
      <div class="container-card ${isBreach ? 'breach' : ''}" id="card-${c.containerId}">
        <div class="container-head">
          <div>
            <div class="cid-title">${c.containerId}</div>
            <div class="cid-base">${c.baseName || 'Convoy In Transit'}</div>
          </div>
          <span class="telemetry-pill ${isBreach ? 'status-breach' : 'status-normal'}">
            ${c.status}
          </span>
        </div>

        <div class="sensor-gauges-grid">
          <div class="gauge-box">
            <span class="gauge-icon">🌡️</span>
            <span class="gauge-label">TEMPERATURE</span>
            <span class="gauge-val ${tempClass}">${temp}°C</span>
          </div>
          <div class="gauge-box">
            <span class="gauge-icon">💧</span>
            <span class="gauge-label">HUMIDITY</span>
            <span class="gauge-val" style="color: var(--accent-cyan);">${humidity}%</span>
          </div>
          <div class="gauge-box">
            <span class="gauge-icon">🔋</span>
            <span class="gauge-label">BATTERY</span>
            <span class="gauge-val ${battery < 30 ? 'val-battery-low' : 'val-battery-ok'}">${battery}%</span>
          </div>
        </div>

        <div class="history-trail">
          <span>GPS: ${lat.toFixed(3)}N, ${lng.toFixed(3)}E</span>
          <span>Heartbeat: ${new Date(c.updatedAt || Date.now()).toLocaleTimeString()}</span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-top:0.25rem;">
          <button class="btn-hud" onclick="focusOnMap('${c.containerId}')" style="flex:1;">
            📍 LOCATE ON MAP
          </button>
          <button class="btn-hud btn-primary" onclick="loadContainerIntoSimulator('${c.containerId}')" style="flex:1;">
            ⚡ SIMULATE
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function focusOnMap(containerId) {
  const container = AppState.containers.find(c => c.containerId === containerId);
  if (!container || !window.TacticalMap) return;

  const tabBtn = document.querySelector('.tab-btn[data-tab="tab-gis"]');
  if (tabBtn) tabBtn.click();

  const [lng, lat] = container.location.coordinates;
  setTimeout(() => {
    window.TacticalMap.setView([lat, lng], 10, { animate: true });
    window.inspectNode(container);
  }, 200);
}

function loadContainerIntoSimulator(containerId) {
  const container = AppState.containers.find(c => c.containerId === containerId);
  if (!container) return;

  const tabBtn = document.querySelector('.tab-btn[data-tab="tab-simulator"]');
  if (tabBtn) tabBtn.click();

  document.getElementById('sim-container-select').value = container.containerId;
  const [lng, lat] = container.location.coordinates;
  document.getElementById('sim-lat').value = lat;
  document.getElementById('sim-lng').value = lng;
  
  const tempSlider = document.getElementById('sim-temp');
  tempSlider.value = container.sensors?.temperature ?? 20;
  document.getElementById('sim-temp-val').textContent = `${tempSlider.value}°C`;

  const humSlider = document.getElementById('sim-hum');
  humSlider.value = container.sensors?.humidity ?? 40;
  document.getElementById('sim-hum-val').textContent = `${humSlider.value}%`;

  const batSlider = document.getElementById('sim-bat');
  batSlider.value = container.sensors?.battery ?? 80;
  document.getElementById('sim-bat-val').textContent = `${batSlider.value}%`;

  printTerminal(`[READY] Loaded ${container.containerId} (${container.baseName}) into Telemetry Injection Console.`, 'info');
}

// Telemetry Simulator Form Controller
function initSimulator() {
  const tempSlider = document.getElementById('sim-temp');
  const tempVal = document.getElementById('sim-temp-val');
  const humSlider = document.getElementById('sim-hum');
  const humVal = document.getElementById('sim-hum-val');
  const batSlider = document.getElementById('sim-bat');
  const batVal = document.getElementById('sim-bat-val');
  const form = document.getElementById('telemetry-sim-form');

  if (tempSlider && tempVal) {
    tempSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      tempVal.textContent = `${v}°C`;
      if (v > 25.0) {
        tempVal.style.color = 'var(--accent-red)';
        tempVal.textContent = `${v}°C (BREACH RISK)`;
      } else {
        tempVal.style.color = 'var(--accent-green)';
      }
    });
  }

  if (humSlider && humVal) {
    humSlider.addEventListener('input', (e) => humVal.textContent = `${e.target.value}%`);
  }

  if (batSlider && batVal) {
    batSlider.addEventListener('input', (e) => batVal.textContent = `${e.target.value}%`);
  }

  // Location Presets
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const lat = btn.getAttribute('data-lat');
      const lng = btn.getAttribute('data-lng');
      document.getElementById('sim-lat').value = lat;
      document.getElementById('sim-lng').value = lng;
      printTerminal(`[GPS LOCK] Waypoint: ${btn.textContent.trim()} -> Lat: ${lat}, Lng: ${lng}`, 'info');
      AudioFX.playBeep(1000, 0.04);
    });
  });

  // Transmit Telemetry
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const containerId = document.getElementById('sim-container-select').value;
      const lat = parseFloat(document.getElementById('sim-lat').value);
      const lng = parseFloat(document.getElementById('sim-lng').value);
      const temperature = parseFloat(document.getElementById('sim-temp').value);
      const humidity = parseInt(document.getElementById('sim-hum').value);
      const battery = parseInt(document.getElementById('sim-bat').value);

      const payload = {
        containerId,
        lat,
        lng,
        temperature,
        humidity,
        battery
      };

      printTerminal(`[TRANSMITTING] Emitting encrypted IoT telemetry burst: ${JSON.stringify(payload)}`);
      AudioFX.playBeep(1300, 0.08);

      try {
        const res = await fetch(`${API_BASE}/api/v1/telemetry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          printTerminal(`[ACK RECEIVED] Telemetry Accepted by P-LFSCS Gateway: Status=${data.container?.status}`, 'out');
        } else {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
      } catch (err) {
        printTerminal(`[OFFLINE LOCAL INGESTION] Processing simulated packet locally: ${err.message}`, 'err');
        
        // Emulate iotIngestionService locally
        let status = 'NORMAL';
        if (temperature > 25.0) status = 'COLD_CHAIN_BREACH';

        const updated = {
          containerId,
          baseName: containerId.includes('LEH') ? 'Leh Forward Depot' : (containerId.includes('KARGIL') ? 'Kargil Transit Hub' : 'In Transit'),
          location: { type: 'Point', coordinates: [lng, lat] },
          sensors: { temperature, humidity, battery },
          status,
          updatedAt: new Date().toISOString()
        };

        handleIncomingTelemetry(updated);
      }
    });
  }

  printTerminal('[SYSTEM INITIALIZED] IoT Telemetry Injection Simulator Ready.', 'out');
}

function printTerminal(msg, type = 'out') {
  const term = document.getElementById('sim-terminal-screen');
  if (!term) return;

  const now = new Date().toLocaleTimeString();
  const div = document.createElement('div');
  div.className = `terminal-line ${type}`;
  div.textContent = `[${now}] ${msg}`;
  term.appendChild(div);
  term.scrollTop = term.scrollHeight;
}

// Global Exports
window.renderContainersGrid = renderContainersGrid;
window.focusOnMap = focusOnMap;
window.loadContainerIntoSimulator = loadContainerIntoSimulator;
window.initSimulator = initSimulator;
window.printTerminal = printTerminal;
