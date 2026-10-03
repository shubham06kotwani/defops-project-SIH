import React, { useState } from 'react';
import { 
  Truck, 
  Thermometer, 
  Battery, 
  Droplets, 
  Send, 
  Radio, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  RotateCcw,
  Zap
} from 'lucide-react';

export const getStatusConfig = (status) => {
  switch (status) {
    case 'COLD_CHAIN_BREACH':
      return {
        label: 'HEAT EXCEEDANCE (>25°C)',
        badgeBg: 'bg-red-100 text-red-700 border-red-300',
        cardBorder: 'border-red-400 bg-red-50/30 hover:border-red-500',
        markerColor: '#ef4444',
        icon: '🔥',
        description: 'Perishable cold-chain thermal limit violated.'
      };
    case 'FREEZING_BREACH':
      return {
        label: 'SUB-ZERO FREEZE (<-10°C)',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
        cardBorder: 'border-sky-400 bg-sky-50/30 hover:border-sky-500',
        markerColor: '#0284c7',
        icon: '❄️',
        description: 'Sub-zero freeze rupture hazard for liquid/medical supplies.'
      };
    case 'TAMPERED':
      return {
        label: 'DOOR SEAL BREACH / TAMPER',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        cardBorder: 'border-amber-400 bg-amber-50/40 hover:border-amber-500',
        markerColor: '#f59e0b',
        icon: '⚠️',
        description: 'Magnetic cargo door seal ruptured or unauthorized access.'
      };
    case 'BATTERY_CRITICAL':
      return {
        label: 'LOW POWER (<=20%)',
        badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
        cardBorder: 'border-orange-400 bg-orange-50/30 hover:border-orange-500',
        markerColor: '#f97316',
        icon: '🪫',
        description: 'IoT solar battery depletion; SATCOM beacon risk.'
      };
    case 'HUMIDITY_EXCESS':
      return {
        label: 'HIGH MOISTURE (>=75%)',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        cardBorder: 'border-indigo-400 bg-indigo-50/30 hover:border-indigo-500',
        markerColor: '#6366f1',
        icon: '💧',
        description: 'Moisture barrier breach; risk to ammo powder & dry stores.'
      };
    default:
      return {
        label: 'OPTIMAL NOMINAL',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        cardBorder: 'border-[#c8ddcf] hover:border-[#1c3824]/60',
        markerColor: '#10b981',
        icon: '🚚',
        description: 'All telemetry variables within green operational limits.'
      };
  }
};

export default function ConvoyTracker({ containers, apiBase, onTelemetryUpdate }) {
  const [targetId, setTargetId] = useState(containers[0]?.containerId || 'CONT-LEH-01');
  const [temperature, setTemperature] = useState(20);
  const [humidity, setHumidity] = useState(40);
  const [battery, setBattery] = useState(85);
  const [isTampered, setIsTampered] = useState(false);
  const [simStatus, setSimStatus] = useState('');
  const [transmitting, setTransmitting] = useState(false);

  // Sync state when picking a target container
  const handleSelectContainer = (c) => {
    setTargetId(c.containerId);
    setTemperature(c.sensors?.temperature ?? 20);
    setHumidity(c.sensors?.humidity ?? 40);
    setBattery(c.sensors?.battery ?? 85);
    setIsTampered(Boolean(c.sensors?.tamper || c.status === 'TAMPERED'));
  };

  const calculateStatus = (temp, hum, batt, tamper) => {
    if (tamper) return 'TAMPERED';
    if (temp > 25.0) return 'COLD_CHAIN_BREACH';
    if (temp < -10.0) return 'FREEZING_BREACH';
    if (batt <= 20) return 'BATTERY_CRITICAL';
    if (hum >= 75) return 'HUMIDITY_EXCESS';
    return 'NORMAL';
  };

  const transmitTelemetry = async (payload) => {
    setTransmitting(true);
    setSimStatus('');

    try {
      const res = await fetch(`${apiBase}/api/v1/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const cfg = getStatusConfig(data.container?.status);
        setSimStatus(`[SATCOM-ACK] PACKET CONFIRMED &bull; NODE STATUS: <strong>${data.container?.status}</strong> (${cfg.label})`);
        if (onTelemetryUpdate) onTelemetryUpdate(data.container);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      const status = calculateStatus(payload.temperature, payload.humidity, payload.battery, payload.tamper);
      const targetContainer = containers.find(c => c.containerId === payload.containerId);
      const coords = targetContainer?.location?.coordinates || [77.5771, 34.1526];

      const updated = {
        containerId: payload.containerId,
        baseName: targetContainer?.baseName || 'In Transit',
        location: { type: 'Point', coordinates: coords },
        sensors: { 
          temperature: payload.temperature, 
          humidity: payload.humidity, 
          battery: payload.battery,
          tamper: payload.tamper
        },
        status,
        updatedAt: new Date().toISOString()
      };

      const cfg = getStatusConfig(status);
      setSimStatus(`[LOCAL-SIM] TELEMETRY INGESTED &bull; STATUS: <strong>${status}</strong> (${cfg.label})`);
      if (onTelemetryUpdate) onTelemetryUpdate(updated);
    } finally {
      setTransmitting(false);
    }
  };

  const handleInjectTelemetry = (e) => {
    e.preventDefault();
    const targetContainer = containers.find(c => c.containerId === targetId);
    const coords = targetContainer?.location?.coordinates || [77.5771, 34.1526];

    const payload = {
      containerId: targetId,
      lat: coords[1],
      lng: coords[0],
      temperature: Number(temperature),
      humidity: Number(humidity),
      battery: Number(battery),
      tamper: Boolean(isTampered),
      baseName: targetContainer?.baseName
    };

    transmitTelemetry(payload);
  };

  const applyPreset = (presetName) => {
    let t = 20, h = 40, b = 85, tamp = false;

    if (presetName === 'HEAT_BREACH') {
      t = 28.5; h = 38; b = 78; tamp = false;
    } else if (presetName === 'FREEZE_BREACH') {
      t = -15.0; h = 65; b = 70; tamp = false;
    } else if (presetName === 'TAMPER') {
      t = 19.5; h = 82; b = 64; tamp = true;
    } else if (presetName === 'LOW_BATT') {
      t = 12.0; h = 35; b = 14; tamp = false;
    } else if (presetName === 'HIGH_HUMID') {
      t = 16.0; h = 88; b = 60; tamp = false;
    } else if (presetName === 'NOMINAL') {
      t = 18.0; h = 42; b = 92; tamp = false;
    }

    setTemperature(t);
    setHumidity(h);
    setBattery(b);
    setIsTampered(tamp);

    const targetContainer = containers.find(c => c.containerId === targetId);
    const coords = targetContainer?.location?.coordinates || [77.5771, 34.1526];

    transmitTelemetry({
      containerId: targetId,
      lat: coords[1],
      lng: coords[0],
      temperature: t,
      humidity: h,
      battery: b,
      tamper: tamp,
      baseName: targetContainer?.baseName
    });
  };

  const predictedCurrentStatus = calculateStatus(Number(temperature), Number(humidity), Number(battery), isTampered);
  const currentConfig = getStatusConfig(predictedCurrentStatus);

  return (
    <div className="space-y-5">
      {/* Live Containers Grid */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-stencil font-bold text-lg text-gray-900 tracking-wider flex items-center gap-2">
            <Truck className="text-[#ff6600]" size={18} />
            <span>ACTIVE CONVOY FORMATIONS &amp; SENSOR TELEMETRY</span>
          </h2>
          <span className="text-xs font-mono text-gray-500">
            {containers.length} Tracked Nodes &bull; {containers.filter(c => c.status !== 'NORMAL').length} Active Alerts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {containers.map((c) => {
            const isAnomaly = c.status !== 'NORMAL';
            const cfg = getStatusConfig(c.status);
            const temp = c.sensors?.temperature ?? 0;
            const isSelected = c.containerId === targetId;

            return (
              <div
                key={c.containerId}
                className={`bg-white border rounded-lg p-4 shadow-xs flex flex-col justify-between transition-all hud-corner-brackets ${cfg.cardBorder} ${
                  isSelected ? 'ring-2 ring-[#ff6600]' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{cfg.icon}</span>
                        <h3 className="font-stencil font-bold text-lg text-gray-900 tracking-wide">
                          {c.containerId}
                        </h3>
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {c.baseName || 'Convoy In Transit'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${cfg.badgeBg} ${
                        isAnomaly ? 'animate-pulse' : ''
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="bg-[#f7faf8] p-2 rounded border border-[#d6e5db]">
                      <Thermometer size={14} className={`mx-auto mb-1 ${temp > 25 ? 'text-red-600 animate-pulse' : temp < -10 ? 'text-sky-600' : 'text-[#ff6600]'}`} />
                      <span className="text-[9px] text-[#997746] block font-mono font-semibold">TEMP</span>
                      <span className={`font-mono font-bold text-sm ${temp > 25 ? 'text-red-600' : temp < -10 ? 'text-sky-600' : 'text-gray-900'}`}>
                        {temp}°C
                      </span>
                    </div>

                    <div className="bg-[#f7faf8] p-2 rounded border border-[#d6e5db]">
                      <Droplets size={14} className={`mx-auto mb-1 ${(c.sensors?.humidity ?? 0) >= 75 ? 'text-indigo-600' : 'text-sky-600'}`} />
                      <span className="text-[9px] text-[#997746] block font-mono font-semibold">HUM</span>
                      <span className={`font-mono font-bold text-sm ${(c.sensors?.humidity ?? 0) >= 75 ? 'text-indigo-600' : 'text-gray-900'}`}>
                        {c.sensors?.humidity ?? '--'}%
                      </span>
                    </div>

                    <div className="bg-[#f7faf8] p-2 rounded border border-[#d6e5db]">
                      <Battery size={14} className={`mx-auto mb-1 ${(c.sensors?.battery ?? 0) <= 20 ? 'text-orange-600' : 'text-emerald-600'}`} />
                      <span className="text-[9px] text-[#997746] block font-mono font-semibold">BATT</span>
                      <span className={`font-mono font-bold text-sm ${(c.sensors?.battery ?? 0) <= 20 ? 'text-orange-600' : 'text-gray-900'}`}>
                        {c.sensors?.battery ?? '--'}%
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-gray-500 mb-3 px-1 flex items-center justify-between">
                    <span>Door Seal Status:</span>
                    <span className={`font-bold flex items-center gap-1 ${c.sensors?.tamper || c.status === 'TAMPERED' ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {c.sensors?.tamper || c.status === 'TAMPERED' ? (
                        <>
                          <Unlock size={11} /> BREACHED
                        </>
                      ) : (
                        <>
                          <Lock size={11} /> SECURED
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectContainer(c)}
                  className={`w-full py-1.5 rounded text-xs font-stencil font-bold tracking-wider transition-all border cursor-pointer ${
                    isSelected 
                      ? 'bg-[#1c3824] text-white border-[#1c3824]' 
                      : 'bg-[#f0f5f1] hover:bg-[#e2ece5] text-[#1c3824] border-[#c8ddcf]'
                  }`}
                >
                  {isSelected ? '✓ CONSOLE ACTIVE' : 'LOAD INTO CONSOLE'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulator Section - Tactical Cockpit Ground Station */}
      <div className="bg-white border border-[#c8ddcf] rounded-lg p-5 shadow-xs hud-corner-brackets">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2 pb-2 border-b border-gray-200">
          <h3 className="font-stencil font-bold text-lg text-gray-900 flex items-center gap-2">
            <Radio className="text-[#ff6600] animate-pulse" size={18} />
            <span>MILITARY IOT TELEMETRY &amp; ANOMALY INJECTION TRANSMITTER</span>
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-600 font-bold">Targeted Outcome:</span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider border ${currentConfig.badgeBg}`}>
              {predictedCurrentStatus} &bull; {currentConfig.label}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-4 font-sans">
          Simulate multi-sensor telemetry conditions across forward logistics corridors. Test automated triggers for <strong>Heat Cold-Chain Breach (&gt;25°C)</strong>, <strong>Sub-Zero Freeze (&lt;-10°C)</strong>, <strong>Physical Tamper / Cargo Seal Rupture</strong>, <strong>Depleted Battery (&le;20%)</strong>, or <strong>High Condensation (&ge;75%)</strong>.
        </p>

        {/* Quick Simulation Presets Bar */}
        <div className="bg-[#f7faf8] border border-[#d6e5db] rounded p-3 mb-5">
          <div className="text-[11px] font-stencil font-bold text-[#1c3824] tracking-wider uppercase mb-2 flex items-center gap-1.5">
            <Zap size={14} className="text-[#ff6600]" />
            <span>ONE-CLICK TACTICAL SCENARIO PRESETS:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('NOMINAL')}
              disabled={transmitting}
              className="px-3 py-1.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-mono font-bold border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={13} />
              <span>🟢 Nominal (20°C / Normal)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('HEAT_BREACH')}
              disabled={transmitting}
              className="px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-red-900 text-xs font-mono font-bold border border-red-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔥 Heat Breach (28.5°C)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('FREEZE_BREACH')}
              disabled={transmitting}
              className="px-3 py-1.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-mono font-bold border border-sky-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>❄️ Sub-Zero Freeze (-15°C)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('TAMPER')}
              disabled={transmitting}
              className="px-3 py-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-mono font-bold border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Unlock size={13} />
              <span>⚠️ Tamper / Door Breach</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('LOW_BATT')}
              disabled={transmitting}
              className="px-3 py-1.5 rounded bg-orange-100 hover:bg-orange-200 text-orange-900 text-xs font-mono font-bold border border-orange-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>🪫 Low Battery (14%)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('HIGH_HUMID')}
              disabled={transmitting}
              className="px-3 py-1.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-mono font-bold border border-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>💧 High Moisture (88%)</span>
            </button>
          </div>
        </div>

        {/* Manual Precision Slider Controls */}
        <form onSubmit={handleInjectTelemetry} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            <div>
              <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                Target Node
              </label>
              <select
                value={targetId}
                onChange={(e) => {
                  const match = containers.find(c => c.containerId === e.target.value);
                  if (match) handleSelectContainer(match);
                  else setTargetId(e.target.value);
                }}
                className="w-full bg-[#f8faf8] border border-[#c8ddcf] text-gray-800 rounded p-2 text-xs font-mono outline-none focus:border-[#ff6600]"
              >
                {containers.map(c => (
                  <option key={c.containerId} value={c.containerId}>
                    {c.containerId} ({c.baseName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                Core Temp: <span className={temperature > 25 ? 'text-red-600 font-mono font-bold animate-pulse' : temperature < -10 ? 'text-sky-600 font-mono font-bold' : 'text-[#b34700] font-mono font-bold'}>{temperature}°C {temperature > 25 ? '[HEAT ALARM]' : temperature < -10 ? '[FREEZE ALARM]' : ''}</span>
              </label>
              <input
                type="range"
                min="-25"
                max="40"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full accent-[#ff6600] cursor-pointer mt-2"
              />
            </div>

            <div>
              <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                Humidity: <span className={humidity >= 75 ? 'text-indigo-600 font-mono font-bold' : 'text-sky-700 font-mono font-bold'}>{humidity}% {humidity >= 75 ? '[CONDENSATION]' : ''}</span>
              </label>
              <input
                type="range"
                min="10"
                max="95"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                className="w-full accent-sky-600 cursor-pointer mt-2"
              />
            </div>

            <div>
              <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                Battery: <span className={battery <= 20 ? 'text-orange-600 font-mono font-bold animate-pulse' : 'text-emerald-700 font-mono font-bold'}>{battery}% {battery <= 20 ? '[CRITICAL]' : ''}</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={battery}
                onChange={(e) => setBattery(e.target.value)}
                className="w-full accent-emerald-600 cursor-pointer mt-2"
              />
            </div>

            <div>
              <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                Cargo Door Seal
              </label>
              <button
                type="button"
                onClick={() => setIsTampered(!isTampered)}
                className={`w-full p-2 mt-0.5 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                  isTampered
                    ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
              >
                {isTampered ? (
                  <>
                    <Unlock size={14} className="text-amber-700" />
                    <span>SEAL COMPROMISED</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} className="text-emerald-700" />
                    <span>SEAL INTACT</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200">
            <div 
              className="text-xs font-mono text-[#1c3824] font-semibold" 
              dangerouslySetInnerHTML={{ __html: simStatus || `Selected configuration generates: <strong>${predictedCurrentStatus}</strong>` }}
            ></div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset('NOMINAL')}
                disabled={transmitting}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-stencil font-bold text-xs tracking-wider px-3.5 py-2.5 rounded flex items-center gap-1.5 border border-gray-300 transition-all cursor-pointer"
                title="Reset target container back to normal parameters"
              >
                <RotateCcw size={13} />
                <span>RESTORE NOMINAL</span>
              </button>

              <button
                type="submit"
                disabled={transmitting}
                className="bg-[#ff6600] hover:bg-[#e65100] text-white font-stencil font-bold text-xs tracking-wider px-5 py-2.5 rounded flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Send size={14} />
                <span>{transmitting ? 'TRANSMITTING SATCOM PACKET...' : 'TRANSMIT TELEMETRY PACKET'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
