/**
 * P-LFSCS: INDIAN ARMY PREDICTIVE LOGISTICS & FORWARD SUPPLY CHAIN
 * Core Application Controller & State Manager
 */

const API_BASE = window.location.port === '5000' || window.location.hostname === 'localhost' 
  ? '' 
  : 'http://localhost:5000';

const AppState = {
  user: {
    serviceNumber: 'IC-10293',
    name: 'Major Vikram Singh',
    rank: 'MAJOR',
    role: 'OFFICER',
    token: null
  },
  theater: 'NORTHERN_COMMAND',
  connected: false,
  soundEnabled: true,
  containers: [],
  indents: [],
  forecast: [],
  selectedContainerId: 'CONT-LEH-01',
  auditLogs: []
};

// Web Audio API Tactical Sound Synthesizer
const AudioFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  },
  playBeep(freq = 880, duration = 0.08, type = 'sine') {
    if (!AppState.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy
    }
  },
  playAlert() {
    if (!AppState.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }
};

// Tactical Clock
function initTacticalClock() {
  const clockEl = document.getElementById('tactical-clock');
  function update() {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const istOffset = 5.5 * 60;
    const localMs = now.getTime() + (now.getTimezoneOffset() * 60000) + (istOffset * 60000);
    const ist = new Date(localMs);
    
    const day = String(ist.getDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const month = months[ist.getMonth()];
    const year = ist.getFullYear();
    const hrs = String(ist.getHours()).padStart(2, '0');
    const mins = String(ist.getMinutes()).padStart(2, '0');
    const secs = String(ist.getSeconds()).padStart(2, '0');
    
    if (clockEl) {
      clockEl.textContent = `${day} ${month} ${year} | ${hrs}:${mins}:${secs} IST`;
    }
  }
  update();
  setInterval(update, 1000);
}

// Navigation Tabs
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');

      AudioFX.playBeep(980, 0.05);

      // If GIS map tab selected, trigger leaflet resize
      if (targetId === 'tab-gis' && window.TacticalMap) {
        setTimeout(() => window.TacticalMap.invalidateSize(), 150);
      }
    });
  });
}

// Initial Tactical Demo Fallback Data (ensures UI is rich even before backend DB is seeded)
const DEFAULT_CONTAINERS = [
  {
    containerId: 'CONT-LEH-01',
    baseName: 'Leh Forward Depot',
    location: { type: 'Point', coordinates: [77.5771, 34.1526] },
    sensors: { temperature: 18.2, humidity: 40, battery: 92 },
    status: 'NORMAL',
    updatedAt: new Date().toISOString(),
    history: [
      { coordinates: [77.5771, 34.1526], temperature: 18.2, timestamp: new Date() }
    ]
  },
  {
    containerId: 'CONT-KARGIL-02',
    baseName: 'Kargil Transit Hub',
    location: { type: 'Point', coordinates: [76.1349, 34.5539] },
    sensors: { temperature: 27.4, humidity: 35, battery: 78 },
    status: 'COLD_CHAIN_BREACH',
    updatedAt: new Date().toISOString(),
    history: [
      { coordinates: [76.1349, 34.5539], temperature: 27.4, timestamp: new Date() }
    ]
  },
  {
    containerId: 'CONT-SIACHEN-03',
    baseName: 'Siachen Base Camp',
    location: { type: 'Point', coordinates: [77.1700, 35.1970] },
    sensors: { temperature: -14.5, humidity: 62, battery: 85 },
    status: 'NORMAL',
    updatedAt: new Date().toISOString(),
    history: [
      { coordinates: [77.1700, 35.1970], temperature: -14.5, timestamp: new Date() }
    ]
  },
  {
    containerId: 'CONT-DRAS-04',
    baseName: 'Dras Mountain Waypoint',
    location: { type: 'Point', coordinates: [75.7600, 34.4300] },
    sensors: { temperature: 4.2, humidity: 48, battery: 64 },
    status: 'NORMAL',
    updatedAt: new Date().toISOString(),
    history: [
      { coordinates: [75.7600, 34.4300], temperature: 4.2, timestamp: new Date() }
    ]
  }
];

const DEFAULT_INDENTS = [
  {
    _id: 'IND-901',
    unitName: 'Forward Post 42 (Kargil)',
    category: 'AMMUNITION',
    quantity: 500,
    priority: 'CRITICAL',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: 'IND-902',
    unitName: 'Siachen Sector Depot',
    category: 'RATIONS',
    quantity: 1200,
    priority: 'HIGH',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    _id: 'IND-903',
    unitName: '14 Corps Dras Sector',
    category: 'FOL',
    quantity: 3500,
    priority: 'HIGH',
    status: 'DISPATCHED',
    createdAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    _id: 'IND-904',
    unitName: 'Leh Military Hospital Wing',
    category: 'MEDICAL',
    quantity: 450,
    priority: 'CRITICAL',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 21600000).toISOString()
  }
];

// Socket.io Real-time Receiver
function initSocket() {
  if (typeof io === 'undefined') return;

  try {
    const socket = io(API_BASE || window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 3000
    });

    socket.on('connect', () => {
      console.log('Secure SATCOM WebSocket Connected');
      updateConnectionStatus(true);
      logAudit('SECURE_COMM_ESTABLISHED', 'Socket connection linked to P-LFSCS Tactical Server');
    });

    socket.on('disconnect', () => {
      console.log('SATCOM WebSocket Disconnected');
      updateConnectionStatus(false);
    });

    socket.on('connect_error', () => {
      updateConnectionStatus(false);
    });

    socket.on('CONVOY_TELEMETRY_UPDATE', (updatedContainer) => {
      console.log('Live Telemetry Received:', updatedContainer);
      handleIncomingTelemetry(updatedContainer);
    });
  } catch (err) {
    console.warn('Socket init fallback:', err);
    updateConnectionStatus(false);
  }
}

function updateConnectionStatus(isConnected) {
  AppState.connected = isConnected;
  const pill = document.getElementById('connection-status-pill');
  if (pill) {
    if (isConnected) {
      pill.className = 'connection-pill';
      pill.innerHTML = '<span class="pulse-dot"></span><span>SECURE SATCOM LINK (PORT 5000)</span>';
    } else {
      pill.className = 'connection-pill offline';
      pill.innerHTML = '<span class="pulse-dot"></span><span>STANDALONE SIMULATION MODE</span>';
    }
  }
}

function handleIncomingTelemetry(container) {
  // Update in local state
  const idx = AppState.containers.findIndex(c => c.containerId === container.containerId);
  if (idx !== -1) {
    AppState.containers[idx] = container;
  } else {
    AppState.containers.push(container);
  }

  // Check breach
  if (container.status === 'COLD_CHAIN_BREACH') {
    AudioFX.playAlert();
    updateAlertMarquee(`⚠️ COLD-CHAIN BREACH DETECTED: Convoy ${container.containerId} at ${container.baseName || 'In Transit'} [Temp: ${container.sensors?.temperature}°C > 25.0°C]`);
  }

  // Update UI components
  if (window.updateMapContainer) window.updateMapContainer(container);
  if (window.renderContainersGrid) window.renderContainersGrid();
  if (window.updateKPIs) window.updateKPIs();

  logAudit(
    container.status === 'COLD_CHAIN_BREACH' ? 'BREACH_ALERT' : 'TELEMETRY_INGESTION',
    `Container: ${container.containerId} | Temp: ${container.sensors?.temperature}°C | Bat: ${container.sensors?.battery}%`,
    container.status === 'COLD_CHAIN_BREACH' ? 'danger' : 'info'
  );
}

function updateAlertMarquee(msg) {
  const el = document.getElementById('marquee-text');
  if (el) el.textContent = msg;
}

// Audit Logger
function logAudit(action, details, level = 'normal') {
  const item = {
    timestamp: new Date().toLocaleTimeString(),
    user: AppState.user.serviceNumber,
    action,
    details,
    level
  };
  AppState.auditLogs.unshift(item);
  if (AppState.auditLogs.length > 50) AppState.auditLogs.pop();
  renderAuditLogs();
}

function renderAuditLogs() {
  const container = document.getElementById('audit-log-stream');
  if (!container) return;

  container.innerHTML = AppState.auditLogs.map(log => `
    <div class="audit-item ${log.level}">
      <div>
        <strong>[${log.timestamp}]</strong> &bull; 
        <span style="color: var(--accent-cyan); font-weight:600;">${log.action}</span> &bull; 
        <span>${log.details}</span>
      </div>
      <div style="font-size: 0.7rem; color: var(--text-muted);">${log.user}</div>
    </div>
  `).join('');
}

// KPI Updater
function updateKPIs() {
  const totalContainers = AppState.containers.length;
  const breaches = AppState.containers.filter(c => c.status === 'COLD_CHAIN_BREACH').length;
  const normal = AppState.containers.filter(c => c.status === 'NORMAL').length;
  const pendingIndents = AppState.indents.filter(i => i.status === 'PENDING').length;

  const totalEl = document.getElementById('kpi-containers-count');
  const breachEl = document.getElementById('kpi-breach-count');
  const pendingEl = document.getElementById('kpi-pending-indents');
  const sustainEl = document.getElementById('kpi-sustainability-idx');

  if (totalEl) totalEl.textContent = totalContainers;
  if (breachEl) {
    breachEl.textContent = `${breaches} BREACHED`;
    const card = document.getElementById('kpi-breach-card');
    if (card) {
      if (breaches > 0) card.classList.add('alert');
      else card.classList.remove('alert');
    }
  }
  if (pendingEl) pendingEl.textContent = pendingIndents;
  if (sustainEl) {
    const avgDays = AppState.forecast.length > 0 
      ? Math.round(AppState.forecast.reduce((a, b) => a + (b.daysOfSustainability || 0), 0) / AppState.forecast.length)
      : 18;
    sustainEl.textContent = `${avgDays} DAYS`;
  }
}

// User Auth Handling
function initAuthModal() {
  const modal = document.getElementById('auth-modal');
  const openBtn = document.getElementById('btn-open-auth');
  const closeBtn = document.getElementById('btn-close-auth');
  const loginForm = document.getElementById('auth-form');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('active'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  // Quick switch buttons
  document.querySelectorAll('.quick-cred-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sNum = btn.getAttribute('data-snum');
      const pass = btn.getAttribute('data-pass');
      document.getElementById('auth-service-number').value = sNum;
      document.getElementById('auth-password').value = pass;
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const serviceNumber = document.getElementById('auth-service-number').value.trim();
      const password = document.getElementById('auth-password').value.trim();

      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceNumber, password })
        });
        const data = await res.json();
        if (data.success && data.user) {
          AppState.user = {
            ...data.user,
            token: data.token
          };
          updateUserDisplay();
          modal.classList.remove('active');
          logAudit('USER_LOGIN_SUCCESS', `Officer logged in: ${AppState.user.name} (${AppState.user.rank})`);
          AudioFX.playBeep(1200, 0.1);
        } else {
          alert(data.error || 'Authentication Failed');
        }
      } catch (err) {
        // Fallback local login simulation if backend unreachable
        if (serviceNumber === 'IC-10293') {
          AppState.user = { serviceNumber: 'IC-10293', name: 'Major Vikram Singh', rank: 'MAJOR', role: 'OFFICER' };
        } else if (serviceNumber === 'OR-88412') {
          AppState.user = { serviceNumber: 'OR-88412', name: 'Havildar Rajesh Kumar', rank: 'HAVILDAR', role: 'OPERATOR' };
        } else {
          AppState.user = { serviceNumber, name: 'Command Officer', rank: 'CAPTAIN', role: 'OFFICER' };
        }
        updateUserDisplay();
        modal.classList.remove('active');
        logAudit('USER_LOGIN_SIMULATED', `Offline mode login for ${AppState.user.name}`);
      }
    });
  }
}

function updateUserDisplay() {
  const nameEl = document.getElementById('current-user-name');
  const roleEl = document.getElementById('current-user-role');
  if (nameEl) nameEl.textContent = `${AppState.user.rank} ${AppState.user.name}`;
  if (roleEl) roleEl.textContent = `${AppState.user.serviceNumber} // ${AppState.user.role}`;
}

// Fetch Initial Data
async function loadInitialData() {
  // Load Containers
  try {
    const res = await fetch(`${API_BASE}/api/v1/containers`);
    if (res.ok) {
      const data = await res.json();
      AppState.containers = data.length > 0 ? data : DEFAULT_CONTAINERS;
      updateConnectionStatus(true);
    } else {
      AppState.containers = DEFAULT_CONTAINERS;
    }
  } catch (e) {
    AppState.containers = DEFAULT_CONTAINERS;
  }

  // Load Indents
  try {
    const res = await fetch(`${API_BASE}/api/v1/indents`);
    if (res.ok) {
      const data = await res.json();
      AppState.indents = data.length > 0 ? data : DEFAULT_INDENTS;
    } else {
      AppState.indents = DEFAULT_INDENTS;
    }
  } catch (e) {
    AppState.indents = DEFAULT_INDENTS;
  }

  // Audio Toggle
  const soundBtn = document.getElementById('btn-sound-toggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      AppState.soundEnabled = !AppState.soundEnabled;
      soundBtn.innerHTML = AppState.soundEnabled 
        ? '🔊 <span>AUDIO ON</span>' 
        : '🔇 <span>AUDIO OFF</span>';
      if (AppState.soundEnabled) AudioFX.playBeep(880, 0.08);
    });
  }

  // Initialize Modules
  if (window.initGISMap) window.initGISMap(AppState.containers);
  if (window.initForecasting) window.initForecasting();
  if (window.renderContainersGrid) window.renderContainersGrid();
  if (window.renderIndentsTable) window.renderIndentsTable();
  if (window.initSimulator) window.initSimulator();

  updateKPIs();
  logAudit('SYSTEM_BOOTSTRAP', 'P-LFSCS Tactical Command Interface Initialized');
}

// DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  initTacticalClock();
  initTabs();
  initAuthModal();
  initSocket();
  loadInitialData();
});

// Export globally
window.AppState = AppState;
window.AudioFX = AudioFX;
window.logAudit = logAudit;
window.updateKPIs = updateKPIs;
window.API_BASE = API_BASE;
window.handleIncomingTelemetry = handleIncomingTelemetry;
