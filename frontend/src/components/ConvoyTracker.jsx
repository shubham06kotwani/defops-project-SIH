import React, { useState } from 'react';
import { Truck, Thermometer, Battery, Droplets, Send } from 'lucide-react';

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
        setSimStatus(`Packet ACK Received &bull; Status: ${data.container?.status}`);
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

      setSimStatus(`Local Telemetry Processed &bull; Status: ${status}`);
      if (onTelemetryUpdate) onTelemetryUpdate(updated);
    } finally {
      setTransmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Containers Grid */}
      <div>
        <h2 className="font-tactical font-bold text-xl text-gray-900 tracking-wide mb-3 flex items-center gap-2">
          <Truck className="text-[#2d6a4f]" size={20} />
          <span>ACTIVE TELEMETRY CONVOYS & FORWARD DEPOTS</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {containers.map((c) => {
            const isBreach = c.status === 'COLD_CHAIN_BREACH';
            const temp = c.sensors?.temperature ?? 0;

            return (
              <div
                key={c.containerId}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isBreach ? 'border-red-200 ring-1 ring-red-100' : 'border-emerald-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2.5">
                    <div>
                      <h3 className="font-tactical font-bold text-lg text-gray-900">
                        {c.containerId}
                      </h3>
                      <div className="text-[11px] text-gray-500">
                        {c.baseName || 'Convoy In Transit'}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isBreach
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-emerald-100 text-[#1b4332] border border-emerald-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                    <div className="bg-[#f6f9f7] p-2.5 rounded-xl border border-gray-100">
                      <Thermometer size={16} className={`mx-auto mb-1 ${temp > 25 ? 'text-red-500' : 'text-[#2d6a4f]'}`} />
                      <span className="text-[9px] text-gray-500 block font-semibold">TEMP</span>
                      <span className={`font-mono font-bold text-sm ${temp > 25 ? 'text-red-600' : 'text-gray-900'}`}>
                        {temp}°C
                      </span>
                    </div>

                    <div className="bg-[#f6f9f7] p-2.5 rounded-xl border border-gray-100">
                      <Droplets size={16} className="mx-auto mb-1 text-cyan-600" />
                      <span className="text-[9px] text-gray-500 block font-semibold">HUM</span>
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {c.sensors?.humidity ?? '--'}%
                      </span>
                    </div>

                    <div className="bg-[#f6f9f7] p-2.5 rounded-xl border border-gray-100">
                      <Battery size={16} className="mx-auto mb-1 text-amber-600" />
                      <span className="text-[9px] text-gray-500 block font-semibold">BATT</span>
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
                  className="w-full py-2 rounded-xl bg-[#edf4ef] hover:bg-[#dfeee3] text-[#1b4332] text-xs font-tactical font-bold tracking-wider transition-all"
                >
                  TEST SENSOR INJECTOR
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulator Section */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <h3 className="font-tactical font-bold text-xl text-gray-900 mb-1 flex items-center gap-2">
          <span>⚡ LIVE SENSOR TELEMETRY PACKET INJECTOR</span>
        </h3>
        <p className="text-xs text-gray-500 mb-5">
          Simulate IoT sensor packet transmission. Moving temperature &gt; 25.0°C immediately triggers an automated Cold-Chain Breach alert across the entire system.
        </p>

        <form onSubmit={handleInjectTelemetry} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-gray-700 font-tactical font-bold uppercase mb-1">
                Target Container
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-[#f8faf9] border border-gray-300 text-gray-800 rounded-lg p-2.5 text-xs font-mono outline-none focus:border-[#2d6a4f]"
              >
                {containers.map(c => (
                  <option key={c.containerId} value={c.containerId}>
                    {c.containerId} ({c.baseName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-tactical font-bold uppercase mb-1">
                Temperature: <span className={temperature > 25 ? 'text-red-600 font-mono font-bold' : 'text-[#2d6a4f] font-mono font-bold'}>{temperature}°C {temperature > 25 ? '(BREACH)' : ''}</span>
              </label>
              <input
                type="range"
                min="-20"
                max="40"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full accent-[#2d6a4f] cursor-pointer mt-2"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-tactical font-bold uppercase mb-1">
                Humidity: <span className="text-cyan-700 font-mono font-bold">{humidity}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="95"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                className="w-full accent-cyan-600 cursor-pointer mt-2"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-tactical font-bold uppercase mb-1">
                Battery: <span className="text-amber-700 font-mono font-bold">{battery}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={battery}
                onChange={(e) => setBattery(e.target.value)}
                className="w-full accent-amber-600 cursor-pointer mt-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-xs font-mono text-[#2d6a4f] font-semibold" dangerouslySetInnerHTML={{ __html: simStatus }}></div>

            <button
              type="submit"
              disabled={transmitting}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-tactical font-bold text-sm tracking-wider px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all"
            >
              <Send size={15} />
              <span>{transmitting ? 'TRANSMITTING...' : 'TRANSMIT IOT PACKET'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
