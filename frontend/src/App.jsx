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
import TacticalMap, { STRATEGIC_LOCATIONS } from './components/TacticalMap';
import DemandForecast from './components/DemandForecast';
import Requisitions from './components/Requisitions';
import ConvoyTracker from './components/ConvoyTracker';

// Configurable remote API for Vercel -> Render production deployment, with relative fallback for local dev
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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
    unitName: 'Forward Post 42 (Kargil Axis)',
    category: 'AMMUNITION',
    quantity: 500,
    priority: 'CRITICAL',
    status: 'PENDING',
    requestedBy: {
      serviceNumber: 'OR-88412',
      name: 'Havildar Rajesh Kumar',
      rank: 'HAVILDAR',
      role: 'OPERATOR'
    },
    approvedBy: null,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: 'IND-902',
    unitName: 'Siachen Sector Glacier Depot',
    category: 'RATIONS',
    quantity: 1200,
    priority: 'HIGH',
    status: 'APPROVED',
    requestedBy: {
      serviceNumber: 'IC-10293',
      name: 'Major Vikram Singh',
      rank: 'MAJOR',
      role: 'OFFICER'
    },
    approvedBy: {
      serviceNumber: 'IC-00101',
      name: 'Brigadier Amitav Sen',
      rank: 'BRIGADIER',
      role: 'COMMANDER',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      remarks: 'Operational requirement verified. Winter ration reserve release approved.'
    },
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    _id: 'IND-903',
    unitName: '14 Corps Dras Sector',
    category: 'FOL',
    quantity: 3500,
    priority: 'HIGH',
    status: 'DISPATCHED',
    requestedBy: {
      serviceNumber: 'OR-88412',
      name: 'Havildar Rajesh Kumar',
      rank: 'HAVILDAR',
      role: 'OPERATOR'
    },
    approvedBy: {
      serviceNumber: 'IC-00101',
      name: 'Brigadier Amitav Sen',
      rank: 'BRIGADIER',
      role: 'COMMANDER',
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      remarks: 'Convoy supply clearance granted for Zoji La corridor.'
    },
    createdAt: new Date(Date.now() - 10800000).toISOString()
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
  const [activeLocation, setActiveLocation] = useState(STRATEGIC_LOCATIONS[0]);
  const [containers, setContainers] = useState(DEFAULT_CONTAINERS);
  const [indents, setIndents] = useState(DEFAULT_INDENTS);
  const [connected, setConnected] = useState(false);

  // Sync real-time Open-Meteo weather for activeLocation if not already present
  useEffect(() => {
    let isMounted = true;
    if (activeLocation?.lat && activeLocation?.lng && !activeLocation.liveWeather) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${activeLocation.lat}&longitude=${activeLocation.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
      fetch(url)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (isMounted && data?.current) {
            setActiveLocation(prev => ({
              ...prev,
              liveWeather: {
                temperature: data.current.temperature_2m,
                humidity: data.current.relative_humidity_2m,
                windSpeed: data.current.wind_speed_10m,
                weatherLabel: data.current.weather_code === 0 ? 'Clear Sky' : data.current.weather_code < 4 ? 'Partly Cloudy' : data.current.weather_code < 70 ? 'Rain' : 'Snowfall',
                weatherIcon: data.current.weather_code === 0 ? '☀️' : data.current.weather_code < 70 ? '🌧️' : '❄️'
              }
            }));
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [activeLocation?.id, activeLocation?.lat, activeLocation?.lng]);

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
      const socket = io(API_BASE || undefined, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 8,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 4000,
        timeout: 5000
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

  const handleUpdateIndentStatus = async (indentId, newStatus, remarks = '') => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/indents/${indentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          remarks,
          user: user || {
            serviceNumber: 'IC-00101',
            name: 'Brigadier Amitav Sen',
            rank: 'BRIGADIER',
            role: 'COMMANDER'
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Requisition status update failed');
      }

      setIndents(prev => prev.map(i => (i._id === indentId ? data : i)));
      return data;
    } catch (err) {
      console.warn('Update indent status:', err.message);
      // Fallback local update if network is offline and not an auth error
      if (!err.message?.includes('Violation') && !err.message?.includes('DENIED') && !err.message?.includes('Prohibited')) {
        setIndents(prev => prev.map(i => i._id === indentId ? { ...i, status: newStatus } : i));
      }
      throw err;
    }
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

  const handleCreateRequisitionFromForecast = (category, qty, locationTarget) => {
    setActiveTab('indents');
    const unit = locationTarget?.name || activeLocation?.name || 'Northern Command Forward Depot';
    handleAddIndent({
      unitName: unit,
      category,
      quantity: qty,
      priority: 'HIGH'
    });
  };

  const anomalyCount = containers.filter(c => c.status && c.status !== 'NORMAL').length;
  const breachCount = containers.filter(c => c.status === 'COLD_CHAIN_BREACH').length;
  const pendingIndents = indents.filter(i => i.status === 'PENDING').length;

  // Dynamic location-adjusted operational metrics
  const locElevation = activeLocation?.elevation || activeLocation?.elev || 3500;
  const locTemp = activeLocation?.liveWeather?.temperature;

  // 1. Dynamic Buffer Sustainability based on altitude and thermal friction
  const dynamicBufferDays = Math.max(7, Math.round(
    32 - (locElevation - 1500) / 250 - (locTemp !== undefined && locTemp < 0 ? Math.abs(locTemp) * 0.35 : 0)
  ));

  // 2. Dynamic Cold Chain & Temperature Hazard
  const isFreezingRisk = locTemp !== undefined && locTemp < -10;
  const isHeatRisk = locTemp !== undefined && locTemp > 25;

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
            {anomalyCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold animate-pulse">
                {anomalyCount}
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

            {/* Operational Sector & Geographic Location Controller Ribbon */}
            <div className="bg-white border border-[#c8ddcf] rounded-lg p-3 shadow-xs hud-corner-brackets flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="p-1.5 rounded bg-[#1c3824] text-white">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-stencil font-bold text-gray-500 uppercase tracking-widest">
                    ACTIVE OPERATIONAL THEATRE // TARGET OUTPOST
                  </div>
                  <div className="font-stencil font-bold text-sm text-[#1c3824] flex items-center gap-2">
                    <span>{activeLocation?.name || 'Northern Command Sector'}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e8f3ec] text-[#1c3824] border border-[#c2dcd0]">
                      {locElevation}m ELEVATION
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeLocation?.id || ''}
                  onChange={(e) => {
                    const found = STRATEGIC_LOCATIONS.find(l => l.id === e.target.value);
                    if (found) setActiveLocation(found);
                  }}
                  className="bg-[#f8faf8] border border-[#c8ddcf] text-gray-800 rounded px-2.5 py-1.5 text-xs font-mono font-bold outline-none focus:border-[#ff6600]"
                >
                  {STRATEGIC_LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      📍 {loc.name} ({loc.elev}m)
                    </option>
                  ))}
                </select>

                {activeLocation?.liveWeather && (
                  <div className="bg-[#f0f6f2] border border-[#c2dcd0] text-[11px] font-mono px-2.5 py-1 rounded flex items-center gap-2">
                    <span className="font-bold text-[#1c3824]">
                      {activeLocation.liveWeather.weatherIcon || '☀️'} {activeLocation.liveWeather.temperature ?? '--'}°C
                    </span>
                    <span className="text-gray-500">&bull;</span>
                    <span className="text-gray-700">{activeLocation.liveWeather.weatherLabel || 'Atmosphere'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Command Center 4 Tactical KPI Gauge Cards - Dynamic to Active Location */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-white border border-[#c8ddcf] rounded-lg p-4 shadow-xs border-l-4 border-l-[#1c3824] hud-corner-brackets transition-all hover:border-[#1c3824]">
                <div className="text-[#1c3824] font-stencil font-bold uppercase tracking-wider text-xs flex items-center justify-between">
                  <span>ACTIVE FORMATIONS</span>
                  <span className="text-[10px] font-mono text-gray-500">GIS LIVE</span>
                </div>
                <div className="font-stencil font-bold text-3xl text-gray-900 mt-1">
                  {containers.length} <small className="text-xs font-normal text-gray-500 font-sans">DEPOTS &amp; CONVOYS</small>
                </div>
                <div className="text-[11px] text-[#16a34a] font-mono mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-ping"></span>
                  <span>{activeLocation?.name?.split(' (')[0] || 'Northern Axis'} Corridor</span>
                </div>
              </div>

              <div className={`bg-white rounded-lg p-4 shadow-xs border-l-4 hud-corner-brackets transition-all ${
                isFreezingRisk || isHeatRisk || breachCount > 0 
                  ? 'border border-red-300 border-l-red-600 bg-red-50/50' 
                  : 'border border-[#c8ddcf] border-l-[#ff6600] hover:border-[#ff6600]'
              }`}>
                <div className="text-gray-700 font-stencil font-bold uppercase tracking-wider text-xs flex items-center justify-between">
                  <span>COLD-CHAIN ASSURANCE</span>
                  <span className="text-[10px] font-mono text-gray-500">SENSORS</span>
                </div>
                <div className={`font-stencil font-bold text-2xl mt-1 ${
                  isFreezingRisk ? 'text-sky-700' : isHeatRisk || breachCount > 0 ? 'text-red-600' : 'text-[#d97706]'
                }`}>
                  {locThermalStatus}
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-1">
                  {isFreezingRisk 
                    ? 'Sub-zero freeze hazard • Cryo-protection active' 
                    : isHeatRisk 
                    ? 'Heat threshold exceeded • Active cooling on' 
                    : 'Thermal Envelope: -10°C to 25.0°C Nominal'}
                </div>
              </div>

              <div className="bg-white border border-[#c8ddcf] rounded-lg p-4 shadow-xs border-l-4 border-l-[#d4b483] hud-corner-brackets transition-all hover:border-[#d4b483]">
                <div className="text-[#997746] font-stencil font-bold uppercase tracking-wider text-xs flex items-center justify-between">
                  <span>BUFFER SUSTAINABILITY</span>
                  <span className="text-[10px] font-mono text-gray-500">AI PROJECTION</span>
                </div>
                <div className="font-stencil font-bold text-3xl text-[#997746] mt-1">
                  {dynamicBufferDays} DAYS <small className="text-xs font-normal text-gray-500 font-sans">RESERVE</small>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-1">
                  {activeLocation?.name?.split(' (')[0] || 'Forward Base'} ({locElevation}m) Burn Dynamics
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
                  Priority Requisitions for {activeLocation?.name?.split(' ')[0] || 'HQ'}
                </div>
              </div>
            </section>

            {/* Tab Views */}
            {activeTab === 'map' && (
              <TacticalMap 
                containers={containers} 
                onSelectContainer={() => {}} 
                onCreateRequisition={handleCreateRequisitionFromForecast}
                apiBase={API_BASE}
                activeLocation={activeLocation}
                onSelectLocation={setActiveLocation}
              />
            )}

            {activeTab === 'forecast' && (
              <DemandForecast 
                apiBase={API_BASE} 
                user={user} 
                onCreateRequisition={handleCreateRequisitionFromForecast} 
                activeLocation={activeLocation}
                onSelectLocation={setActiveLocation}
              />
            )}

            {activeTab === 'indents' && (
              <Requisitions 
                indents={indents} 
                onAddIndent={handleAddIndent} 
                onUpdateStatus={handleUpdateIndentStatus} 
                user={user}
                onSwitchUser={handleLogin}
                activeLocation={activeLocation}
              />
            )}

            {activeTab === 'telemetry' && (
              <ConvoyTracker 
                containers={containers} 
                apiBase={API_BASE} 
                onTelemetryUpdate={handleTelemetryUpdate}
                activeLocation={activeLocation}
                onSelectLocation={setActiveLocation} 
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
