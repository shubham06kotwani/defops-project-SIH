import React, { useState } from 'react';
import { Truck, Thermometer, Battery, Droplets, Send, Radio, AlertOctagon } from 'lucide-react';

export default function ConvoyTracker({ containers, apiBase, onTelemetryUpdate }) {
  const [targetId, setTargetId] = useState(containers[0]?.containerId || 'CONT-LEH-01');
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(40);
  const [battery, setBattery] = useState(85);
  const [simStatus, setSimStatus] = useState('');
  const [transmitting, setTransmitting] = useState(false);

  const handleInjectTelemetry = async (e) => {
    e.preventDefault();
    setTransmitting(true);
    setSimStatus('');

    const targetContainer = containers.find(c => c.containerId === targetId);
    const coords = targetContainer?.location?.coordinates || [77.5771, 34.1526];

    const payload = {
      containerId: targetId,
      lat: coords[1],
      lng: coords[0],
      temperature: Number(temperature),
      humidity: Number(humidity),
      battery: Number(battery)
    };

    try {
      const res = await fetch(`${apiBase}/api/v1/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSimStatus(`[ACK-OK] PACKET RECEIVED &bull; CONTAINER STATUS: ${data.container?.status}`);
        if (onTelemetryUpdate) onTelemetryUpdate(data.container);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      let status = 'NORMAL';
      if (temperature > 25.0) status = 'COLD_CHAIN_BREACH';

      const updated = {
        containerId: targetId,
        baseName: targetContainer?.baseName || 'In Transit',
        location: { type: 'Point', coordinates: coords },
        sensors: { temperature: Number(temperature), humidity: Number(humidity), battery: Number(battery) },
        status,
        updatedAt: new Date().toISOString()
      };

      setSimStatus(`[SIM-OK] LOCAL PACKET INGESTED &bull; STATUS: ${status}`);
      if (onTelemetryUpdate) onTelemetryUpdate(updated);
    } finally {
      setTransmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Live Containers Grid */}
      <div>
        <h2 className="font-stencil font-bold text-lg text-gray-900 tracking-wider mb-3 flex items-center gap-2">
          <Truck className="text-[#ff6600]" size={18} />
          <span>ACTIVE CONVOY FORMATIONS &amp; SENSOR TELEMETRY</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {containers.map((c) => {
            const isBreach = c.status === 'COLD_CHAIN_BREACH';
            const temp = c.sensors?.temperature ?? 0;

            return (
              <div
                key={c.containerId}
                className={`bg-white border rounded-lg p-4 shadow-xs flex flex-col justify-between transition-all hud-corner-brackets ${
                  isBreach 
                    ? 'border-red-300 bg-red-50/30 hover:border-red-500' 
                    : 'border-[#c8ddcf] hover:border-[#1c3824]/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2.5">
                    <div>
                      <h3 className="font-stencil font-bold text-lg text-gray-900 tracking-wide">
                        {c.containerId}
                      </h3>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {c.baseName || 'Convoy In Transit'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isBreach
                          ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                    <div className="bg-[#f7faf8] p-2 rounded border border-[#d6e5db]">
                      <Thermometer size={14} className={`mx-auto mb-1 ${temp > 25 ? 'text-red-600 animate-pulse' : 'text-[#ff6600]'}`} />
                      <span className="text-[9px] text-[#997746] block font-mono font-semibold">TEMP</span>
                      <span className={`font-mono font-bold text-sm ${temp > 25 ? 'text-red-600' : 'text-gray-900'}`}>
                        {temp}°C
                      </span>
                    </div>

                    <div className="bg-[#f7faf8] p-2 rounded border border-[#d6e5db]">
                      <Droplets size={14} className="mx-auto mb-1 text-sky-600" />
                      <span className="text-[9px] text-[#997746] block font-mono font-semibold">HUM</span>
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {c.sensors?.humidity ?? '--'}%
                      </span>
                    </div>

                    <div className="bg-[#f7faf8] p-2 rounded border border-[#d6e5db]">
                      <Battery size={14} className="mx-auto mb-1 text-emerald-600" />
                      <span className="text-[9px] text-[#997746] block font-mono font-semibold">BATT</span>
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {c.sensors?.battery ?? '--'}%
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTargetId(c.containerId);
                    setTemperature(c.sensors?.temperature ?? 22);
                  }}
                  className="w-full py-1.5 rounded bg-[#f0f5f1] hover:bg-[#e2ece5] text-[#1c3824] text-xs font-stencil font-bold tracking-wider transition-all border border-[#c8ddcf] cursor-pointer"
                >
                  LOAD INTO SENSOR CONSOLE
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulator Section - Tactical Cockpit Ground Station (Pure White Surface) */}
      <div className="bg-white border border-[#c8ddcf] rounded-lg p-5 shadow-xs hud-corner-brackets">
        <h3 className="font-stencil font-bold text-lg text-gray-900 mb-1 flex items-center gap-2">
          <Radio className="text-[#ff6600] animate-pulse" size={18} />
          <span>MILITARY IOT TELEMETRY PACKET TRANSMITTER</span>
        </h3>
        <p className="text-xs text-gray-600 mb-5 font-sans">
          Simulate battlefield IoT sensor transmission over SATCOM/MQTT. Setting core temperature &gt; 25.0°C immediately triggers an automated Cold-Chain Anomaly alarm across all command terminals.
        </p>

        <form onSubmit={handleInjectTelemetry} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                Target Formation / Node
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
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
                Core Temp: <span className={temperature > 25 ? 'text-red-600 font-mono font-bold animate-pulse' : 'text-[#b34700] font-mono font-bold'}>{temperature}°C {temperature > 25 ? '[ALARM]' : ''}</span>
              </label>
              <input
                type="range"
                min="-20"
                max="40"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full accent-[#ff6600] cursor-pointer mt-2"
              />
            </div>

            <div>
              <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                Humidity: <span className="text-sky-700 font-mono font-bold">{humidity}%</span>
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
                Battery: <span className="text-emerald-700 font-mono font-bold">{battery}%</span>
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
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div 
              className="text-xs font-mono text-[#1c3824] font-semibold" 
              dangerouslySetInnerHTML={{ __html: simStatus }}
            ></div>

            <button
              type="submit"
              disabled={transmitting}
              className="bg-[#ff6600] hover:bg-[#e65100] text-white font-stencil font-bold text-xs tracking-wider px-5 py-2.5 rounded flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Send size={14} />
              <span>{transmitting ? 'BROADCASTING SATCOM PACKET...' : 'TRANSMIT SENSOR TELEMETRY'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
