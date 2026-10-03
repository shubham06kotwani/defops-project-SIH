import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  MapPin, 
  TrendingUp, 
  FileText, 
  Truck, 
  LogOut, 
  LogIn,
  ShieldCheck, 
  AlertTriangle,
  Radio
} from 'lucide-react';

import AuthPage from './components/AuthPage';
import TacticalMap from './components/TacticalMap';
import DemandForecast from './components/DemandForecast';
import Requisitions from './components/Requisitions';
import ConvoyTracker from './components/ConvoyTracker';

const API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';

const DEFAULT_CONTAINERS = [
  {
    containerId: 'CONT-LEH-01',
    baseName: 'Leh Forward Depot',
    location: { type: 'Point', coordinates: [77.5771, 34.1526] },
    sensors: { temperature: 18.2, humidity: 40, battery: 92 },
    status: 'NORMAL',
    updatedAt: new Date().toISOString()
  },
  {
    containerId: 'CONT-KARGIL-02',
    baseName: 'Kargil Transit Hub',
    location: { type: 'Point', coordinates: [76.1349, 34.5539] },
    sensors: { temperature: 27.4, humidity: 35, battery: 78 },
    status: 'COLD_CHAIN_BREACH',
    updatedAt: new Date().toISOString()
  },
  {
    containerId: 'CONT-SIACHEN-03',
    baseName: 'Siachen Base Camp',
    location: { type: 'Point', coordinates: [77.1700, 35.1970] },
    sensors: { temperature: -14.5, humidity: 62, battery: 85 },
    status: 'NORMAL',
    updatedAt: new Date().toISOString()
  },
  {
    containerId: 'CONT-DRAS-04',
    baseName: 'Dras Mountain Post',
    location: { type: 'Point', coordinates: [75.7600, 34.4300] },
    sensors: { temperature: 4.2, humidity: 48, battery: 64 },
    status: 'NORMAL',
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_INDENTS = [
  {
    _id: 'IND-901',
    unitName: 'Forward Post 42 (Kargil)',
    category: 'AMMUNITION',
    quantity: 500,
    priority: 'CRITICAL',
    status: 'PENDING'
  },
  {
    _id: 'IND-902',
    unitName: 'Siachen Sector Depot',
    category: 'RATIONS',
    quantity: 1200,
    priority: 'HIGH',
    status: 'APPROVED'
  },
  {
    _id: 'IND-903',
    unitName: '14 Corps Dras Sector',
    category: 'FOL',
    quantity: 3500,
    priority: 'HIGH',
    status: 'DISPATCHED'
  }
];

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('defops_user') || localStorage.getItem('plfscs_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('map');
  const [containers, setContainers] = useState(DEFAULT_CONTAINERS);
  const [indents, setIndents] = useState(DEFAULT_INDENTS);
  const [connected, setConnected] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('defops_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('defops_user');
    localStorage.removeItem('plfscs_user');
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/containers`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (data && data.length > 0) setContainers(data);
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/indents`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (data && data.length > 0) setIndents(data);
      })
      .catch(() => {});

    try {
      const socket = io(API_BASE || window.location.origin, {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      socket.on('CONVOY_TELEMETRY_UPDATE', (updated) => {
        setContainers(prev => {
          const idx = prev.findIndex(c => c.containerId === updated.containerId);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          }
          return [...prev, updated];
        });
      });

      return () => socket.disconnect();
    } catch (e) {
      setConnected(false);
    }
  }, []);

  const handleAddIndent = async (newIndent) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/indents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIndent)
      });
      if (res.ok) {
        const saved = await res.json();
        setIndents(prev => [saved, ...prev]);
        return;
      }
    } catch (err) {}

    setIndents(prev => [{ ...newIndent, _id: 'IND-' + Date.now().toString().slice(-4), status: 'PENDING' }, ...prev]);
  };

  const handleUpdateIndentStatus = (indentId, newStatus) => {
    setIndents(prev => prev.map(i => i._id === indentId ? { ...i, status: newStatus } : i));
  };

  const handleTelemetryUpdate = (updatedContainer) => {
    setContainers(prev => {
      const idx = prev.findIndex(c => c.containerId === updatedContainer.containerId);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedContainer;
        return copy;
      }
      return [...prev, updatedContainer];
    });
  };

  const handleCreateRequisitionFromForecast = (category, qty) => {
    setActiveTab('indents');
    handleAddIndent({
      unitName: 'Northern Command Forward Depot',
      category,
      quantity: qty,
      priority: 'HIGH'
    });
  };

  const breachCount = containers.filter(c => c.status === 'COLD_CHAIN_BREACH').length;
  const pendingIndents = indents.filter(i => i.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-gray-900 flex flex-col font-sans">
      
      {/* Top Classification Ribbon - Deep Olive & Desert Tan */}
      <div className="bg-[#122416] text-[#d4b483] text-[11px] font-mono tracking-widest px-6 py-1.5 flex items-center justify-between border-b border-[#1b3621]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#ff6600] animate-ping"></span>
          <span>🔒 RESTRICTED // DEFENCE SERVICES STAFF COLLEGE &bull; MoD // SEC-LEVEL 4</span>
        </div>
        <span className="font-mono text-xs text-emerald-200 hidden sm:inline-block">
          DEFOPS MIL-NET &bull; {connected ? <span className="text-[#00e655] font-semibold">🟢 SATCOM LINK ARMED</span> : <span className="text-[#ffaa66] font-semibold">🟡 LOCAL TACTICAL SIMULATION</span>}
        </span>
      </div>

      {/* Military Field Telemetry & Compass Ticker */}
      <div className="bg-[#eaf1ec] border-b border-[#c8dacf] px-6 py-1 flex items-center justify-between text-[10px] font-mono text-[#1d3d25] overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-4">
          <span>THEATRE: <strong className="text-[#122416] font-bold">NORTHERN COMMAND</strong></span>
          <span className="hidden md:inline">CORRIDORS: <strong className="text-gray-700">NH-1D // KARGIL-LEH // SIACHEN AXIS</strong></span>
          <span className="hidden lg:inline">COORDS: <strong className="text-gray-700">34.1526°N, 77.5771°E</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>ELEV: <strong className="text-gray-700">3,500M - 5,400M</strong></span>
          <span>DEFCON: <strong className="text-[#ff6600] font-bold">3 (ENHANCED READINESS)</strong></span>
        </div>
      </div>

      {/* Main Header - Clean White Command Center */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#c8ddcf] px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('map')}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          title="Return to GIS Map"
        >
          <div className="relative">
            <img 
              src="/logo.jpg" 
              alt="Indian Army Emblem" 
              className="w-11 h-11 rounded-full border-2 border-[#1c3824] object-cover shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#1b2e1e] border border-[#00e655] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e655] animate-pulse"></span>
            </div>
          </div>
          <div>
            <h1 className="font-stencil font-bold text-2xl text-gray-900 tracking-widest leading-none flex items-center gap-2">
              DEFOPS <span className="text-[#1c3824] font-normal text-xs font-mono tracking-normal border border-[#1c3824]/30 px-1.5 py-0.5 rounded bg-[#1c3824]/10">INDIAN ARMY</span>
            </h1>
            <p className="text-[11px] text-gray-500 font-sans tracking-wide mt-0.5">
              Predictive Logistics & Forward Supply Chain Management
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Micro-Chamfered Tactical Pills */}
        <nav className="flex items-center gap-1.5 bg-[#edf4ef] p-1 rounded-lg border border-[#c8ddcf]">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-stencil font-bold tracking-wider transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-[#1c3824] text-white shadow-xs'
                : 'text-gray-700 hover:text-[#1c3824] hover:bg-white'
            }`}
          >
            <MapPin size={14} />
            <span>GIS MAP</span>
          </button>

          <button
            onClick={() => setActiveTab('forecast')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-stencil font-bold tracking-wider transition-all cursor-pointer ${
              activeTab === 'forecast'
                ? 'bg-[#1c3824] text-white shadow-xs'
                : 'text-gray-700 hover:text-[#1c3824] hover:bg-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>AI DEMAND FORECAST</span>
          </button>

          <button
            onClick={() => setActiveTab('indents')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-stencil font-bold tracking-wider transition-all cursor-pointer ${
              activeTab === 'indents'
                ? 'bg-[#1c3824] text-white shadow-xs'
                : 'text-gray-700 hover:text-[#1c3824] hover:bg-white'
            }`}
          >
            <FileText size={14} />
            <span>REQUISITIONS ({indents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-stencil font-bold tracking-wider transition-all cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-[#1c3824] text-white shadow-xs'
                : 'text-gray-700 hover:text-[#1c3824] hover:bg-white'
            }`}
          >
            <Truck size={14} />
            <span>IOT TRACKER</span>
            {breachCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold animate-pulse">
                {breachCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('login')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-stencil font-bold tracking-wider transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-[#ff6600] text-white shadow-xs'
                : user 
                  ? 'text-gray-600 hover:text-[#1c3824] hover:bg-white' 
                  : 'text-[#1c3824] font-bold hover:bg-white'
            }`}
          >
            <LogIn size={14} />
            <span>{user ? 'SWITCH USER' : 'LOGIN'}</span>
          </button>
        </nav>

        {/* User Profile or Sign In Button */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#edf4ef] border border-[#c8ddcf] text-xs">
                <div className="w-7 h-7 rounded bg-[#1c3824] font-bold flex items-center justify-center text-white text-xs font-stencil">
                  {user.rank ? user.rank[0] : 'O'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 leading-tight font-sans">{user.name}</div>
                  <div className="text-[10px] text-[#1c3824] font-mono font-bold">{user.serviceNumber} &bull; {user.role}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('login')}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[#1c3824] hover:bg-[#2b5437] text-white text-xs font-stencil font-bold tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <LogIn size={15} />
              <span>OFFICER SIGN IN</span>
            </button>
          )}
        </div>

      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {activeTab === 'login' ? (
          <AuthPage 
            onLogin={(userData) => {
              handleLogin(userData);
              setActiveTab('map');
            }} 
            apiBase={API_BASE}
            onBack={() => setActiveTab('map')}
          />
        ) : (
          <>
            {/* Tactical Preview Notice if not logged in */}
            {!user && (
              <div className="bg-white border border-[#c8ddcf] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs hud-corner-brackets">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff6600] animate-pulse"></span>
                  <div className="text-xs text-gray-700 font-sans">
                    <span className="font-stencil font-bold text-[#1c3824] uppercase tracking-wider mr-2">
                      OPERATIONAL PREVIEW:
                    </span>
                    Live GIS logistics theatre active in Read-Only Mode. Sign in with Military Service Number for command dispatch authorization.
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-3.5 py-1.5 bg-[#ff6600] hover:bg-[#e65100] text-white text-xs font-stencil font-bold rounded tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <LogIn size={13} />
                  <span>SIGN IN NOW</span>
                </button>
              </div>
            )}

            {/* Command Center 4 Tactical KPI Gauge Cards - Clean White Surface */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-white border border-[#c8ddcf] rounded-lg p-4 shadow-xs border-l-4 border-l-[#1c3824] hud-corner-brackets transition-all hover:border-[#1c3824]">
                <div className="text-[#1c3824] font-stencil font-bold uppercase tracking-wider text-xs flex items-center justify-between">
                  <span>ACTIVE FORMATIONS</span>
                  <span className="text-[10px] font-mono text-gray-500">GIS LIVE</span>
                </div>
                <div className="font-stencil font-bold text-3xl text-gray-900 mt-1">
                  {containers.length} <small className="text-xs font-normal text-gray-500 font-sans">DEPOTS & CONVOYS</small>
                </div>
                <div className="text-[11px] text-[#16a34a] font-mono mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-ping"></span>
                  <span>Sat-Tracked Northern Axis</span>
                </div>
              </div>

              <div className={`bg-white rounded-lg p-4 shadow-xs border-l-4 hud-corner-brackets transition-all ${
                breachCount > 0 
                  ? 'border border-red-300 border-l-red-600 bg-red-50/50' 
                  : 'border border-[#c8ddcf] border-l-[#ff6600] hover:border-[#ff6600]'
              }`}>
                <div className="text-gray-700 font-stencil font-bold uppercase tracking-wider text-xs flex items-center justify-between">
                  <span>COLD-CHAIN ASSURANCE</span>
                  <span className="text-[10px] font-mono text-gray-500">SENSORS</span>
                </div>
                <div className={`font-stencil font-bold text-3xl mt-1 ${breachCount > 0 ? 'text-red-600' : 'text-[#d97706]'}`}>
                  {breachCount > 0 ? `${breachCount} BREACH DETECTED` : '100% NOMINAL'}
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-1">
                  Threshold: &le; 25.0°C Medical/Munitions
                </div>
              </div>

              <div className="bg-white border border-[#c8ddcf] rounded-lg p-4 shadow-xs border-l-4 border-l-[#d4b483] hud-corner-brackets transition-all hover:border-[#d4b483]">
                <div className="text-[#997746] font-stencil font-bold uppercase tracking-wider text-xs flex items-center justify-between">
                  <span>BUFFER SUSTAINABILITY</span>
                  <span className="text-[10px] font-mono text-gray-500">AI PROJECTION</span>
                </div>
                <div className="font-stencil font-bold text-3xl text-[#997746] mt-1">
                  18 DAYS <small className="text-xs font-normal text-gray-500 font-sans">RESERVE</small>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-1">
                  Leh &bull; Kargil &bull; Siachen Buffer
                </div>
              </div>

              <div className="bg-white border border-[#c8ddcf] rounded-lg p-4 shadow-xs border-l-4 border-l-[#18294a] hud-corner-brackets transition-all hover:border-[#243a66]">
                <div className="text-[#18294a] font-stencil font-bold uppercase tracking-wider text-xs flex items-center justify-between">
                  <span>PENDING INDENTS</span>
                  <span className="text-[10px] font-mono text-gray-500">ACTION</span>
                </div>
                <div className="font-stencil font-bold text-3xl text-sky-700 mt-1">
                  {pendingIndents} <small className="text-xs font-normal text-gray-500 font-sans">AWAITING</small>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-1">
                  Priority Forward Requisitions
                </div>
              </div>
            </section>

            {/* Tab Views */}
            {activeTab === 'map' && (
              <TacticalMap 
                containers={containers} 
                onSelectContainer={() => {}} 
              />
            )}

            {activeTab === 'forecast' && (
              <DemandForecast 
                apiBase={API_BASE} 
                user={user} 
                onCreateRequisition={handleCreateRequisitionFromForecast} 
              />
            )}

            {activeTab === 'indents' && (
              <Requisitions 
                indents={indents} 
                onAddIndent={handleAddIndent} 
                onUpdateStatus={handleUpdateIndentStatus} 
              />
            )}

            {activeTab === 'telemetry' && (
              <ConvoyTracker 
                containers={containers} 
                apiBase={API_BASE} 
                onTelemetryUpdate={handleTelemetryUpdate} 
              />
            )}
          </>
        )}

      </main>

      {/* Tactical Command Center Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 text-center text-xs text-gray-600 font-mono flex flex-wrap items-center justify-center gap-2">
        <span className="text-[#1c3824] font-bold">DEFOPS TACTICAL</span>
        <span>&bull;</span>
        <span>INDIAN ARMY LOGISTICS ASSURANCE</span>
        <span>&bull;</span>
        <span>DEFENCE SERVICES STAFF COLLEGE</span>
        <span>&bull;</span>
        <span className="text-[#16a34a] font-semibold">SATELLITE GIS ACTIVE</span>
      </footer>

    </div>
  );
}
