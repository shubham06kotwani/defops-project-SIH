import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  MapPin, 
  TrendingUp, 
  FileText, 
  Truck, 
  LogOut, 
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
      const saved = localStorage.getItem('plfscs_user');
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
    localStorage.setItem('plfscs_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('plfscs_user');
  };

  useEffect(() => {
    if (!user) return;

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
  }, [user]);

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

  if (!user) {
    return <AuthPage onLogin={handleLogin} apiBase={API_BASE} />;
  }

  const breachCount = containers.filter(c => c.status === 'COLD_CHAIN_BREACH').length;
  const pendingIndents = indents.filter(i => i.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-gray-800 flex flex-col font-sans">
      
      {/* Top Classification Ribbon - Shady Forest Green */}
      <div className="bg-[#1b4332] text-emerald-100 text-[11px] font-tactical font-bold tracking-widest px-6 py-1.5 flex items-center justify-between border-b border-[#2d6a4f]/50">
        <span>🔒 RESTRICTED // DEFENCE SERVICES STAFF COLLEGE &bull; MoD</span>
        <span className="font-mono text-xs opacity-90">
          P-LFSCS TACTICAL NETWORK &bull; {connected ? '🟢 SATCOM LINK ACTIVE' : '🟡 LOCAL SIMULATION'}
        </span>
      </div>

      {/* Main Header - Clean White with Shady Green Accents */}
      <header className="bg-white/95 backdrop-blur-md border-b border-emerald-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo.jpg" 
            alt="Indian Army Emblem" 
            className="w-11 h-11 rounded-full border-2 border-[#2d6a4f] object-cover shadow-sm"
          />
          <div>
            <h1 className="font-tactical font-bold text-2xl text-gray-900 tracking-wider leading-none">
              P-LFSCS <span className="text-[#2d6a4f] font-normal text-sm font-sans">| Indian Army</span>
            </h1>
            <p className="text-xs text-gray-500 font-sans tracking-wide">
              Predictive Logistics & Forward Supply Chain Management
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-[#edf3ef] p-1 rounded-xl border border-emerald-200/60">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-tactical font-bold tracking-wider transition-all ${
              activeTab === 'map'
                ? 'bg-[#2d6a4f] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#1b4332] hover:bg-white/80'
            }`}
          >
            <MapPin size={15} />
            <span>GIS MAP</span>
          </button>

          <button
            onClick={() => setActiveTab('forecast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-tactical font-bold tracking-wider transition-all ${
              activeTab === 'forecast'
                ? 'bg-[#2d6a4f] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#1b4332] hover:bg-white/80'
            }`}
          >
            <TrendingUp size={15} />
            <span>AI DEMAND FORECAST</span>
          </button>

          <button
            onClick={() => setActiveTab('indents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-tactical font-bold tracking-wider transition-all ${
              activeTab === 'indents'
                ? 'bg-[#2d6a4f] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#1b4332] hover:bg-white/80'
            }`}
          >
            <FileText size={15} />
            <span>REQUISITIONS ({indents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-tactical font-bold tracking-wider transition-all ${
              activeTab === 'telemetry'
                ? 'bg-[#2d6a4f] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#1b4332] hover:bg-white/80'
            }`}
          >
            <Truck size={15} />
            <span>IOT TRACKER</span>
            {breachCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold animate-pulse">
                {breachCount}
              </span>
            )}
          </button>
        </nav>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#edf4f0] border border-emerald-200/80 text-xs">
            <div className="w-7 h-7 rounded-full bg-[#2d6a4f] font-bold flex items-center justify-center text-white text-xs">
              {user.rank ? user.rank[0] : 'O'}
            </div>
            <div>
              <div className="font-semibold text-gray-900 leading-tight">{user.name}</div>
              <div className="text-[10px] text-[#2d6a4f] font-mono font-bold">{user.serviceNumber} &bull; {user.role}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 transition-colors"
            title="Sign Out to Login Page"
          >
            <LogOut size={16} />
          </button>
        </div>

      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Clean, Shady-Green 4 KPI Metric Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white border border-emerald-100/80 rounded-xl p-4 shadow-xs border-l-4 border-l-[#2d6a4f] transition-all hover:shadow-sm">
            <div className="text-gray-500 font-tactical font-bold uppercase tracking-wider text-xs">
              Active Formations
            </div>
            <div className="font-tactical font-bold text-3xl text-gray-900 mt-1">
              {containers.length} <small className="text-xs font-normal text-gray-500 font-sans">DEPOTS & CONVOYS</small>
            </div>
            <div className="text-[11px] text-[#2d6a4f] font-medium mt-1">● Monitored live via GIS</div>
          </div>

          <div className={`rounded-xl p-4 shadow-xs border-l-4 transition-all hover:shadow-sm ${
            breachCount > 0 
              ? 'bg-red-50/60 border border-red-200 border-l-red-500' 
              : 'bg-white border border-emerald-100/80 border-l-[#2d6a4f]'
          }`}>
            <div className="text-gray-500 font-tactical font-bold uppercase tracking-wider text-xs">
              Cold-Chain Status
            </div>
            <div className={`font-tactical font-bold text-3xl mt-1 ${breachCount > 0 ? 'text-red-600' : 'text-[#2d6a4f]'}`}>
              {breachCount > 0 ? `${breachCount} BREACH DETECTED` : '100% HEALTHY'}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">● Threshold: 25.0°C maximum</div>
          </div>

          <div className="bg-white border border-emerald-100/80 rounded-xl p-4 shadow-xs border-l-4 border-l-[#40916c] transition-all hover:shadow-sm">
            <div className="text-gray-500 font-tactical font-bold uppercase tracking-wider text-xs">
              Buffer Sustainability
            </div>
            <div className="font-tactical font-bold text-3xl text-amber-600 mt-1">
              18 DAYS <small className="text-xs font-normal text-gray-500 font-sans">AVERAGE</small>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">● Northern Sector Reserve</div>
          </div>

          <div className="bg-white border border-emerald-100/80 rounded-xl p-4 shadow-xs border-l-4 border-l-[#1b4332] transition-all hover:shadow-sm">
            <div className="text-gray-500 font-tactical font-bold uppercase tracking-wider text-xs">
              Pending Requisitions
            </div>
            <div className="font-tactical font-bold text-3xl text-cyan-700 mt-1">
              {pendingIndents} <small className="text-xs font-normal text-gray-500 font-sans">AWAITING ACTION</small>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">● Critical Siachen/Kargil posts</div>
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

      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-gray-200/80 py-3 text-center text-xs text-gray-500 font-mono">
        Indian Army Predictive Logistics &bull; Defence Services Staff College &bull; OpenStreetMap GIS Integration
      </footer>

    </div>
  );
}
