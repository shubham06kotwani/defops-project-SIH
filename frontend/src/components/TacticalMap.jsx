import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Thermometer, Battery, Droplets, Mountain, Radio } from 'lucide-react';

const STRATEGIC_CORRIDORS = [
  {
    name: 'NH-1D Axis (Srinagar - Dras - Kargil)',
    points: [
      [34.0837, 74.7973], // Srinagar
      [34.2800, 75.5000], // Zoji La
      [34.4300, 75.7600], // Dras
      [34.5539, 76.1349]  // Kargil
    ],
    color: '#38bdf8' // Tactical Cyan
  },
  {
    name: 'Kargil - Leh Forward Line',
    points: [
      [34.5539, 76.1349], // Kargil
      [34.2980, 76.8290], // Lamayuru
      [34.1526, 77.5771]  // Leh
    ],
    color: '#00e655' // HUD Green
  },
  {
    name: 'Leh - Khardung La - Siachen Axis',
    points: [
      [34.1526, 77.5771], // Leh
      [34.2787, 77.6047], // Khardung La
      [34.6150, 77.4600], // Diskit
      [35.1970, 77.1700]  // Siachen Base
    ],
    color: '#ff6600' // High-Visibility Safety Orange
  }
];

export default function TacticalMap({ containers, onSelectContainer }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [mapMode, setMapMode] = useState('RADAR'); // 'RADAR' or 'SATELLITE'

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [34.45, 76.85],
        zoom: 8,
        minZoom: 6,
        maxZoom: 16
      });

      // Supply Corridors with Tactical Glow
      STRATEGIC_CORRIDORS.forEach(route => {
        L.polyline(route.points, {
          color: route.color,
          weight: 4,
          opacity: 0.95,
          dashArray: '8, 8'
        }).addTo(map).bindTooltip(
          `<div style="font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:bold; color:#d4b483; background:#0d121a; padding:4px 8px; border:1px solid ${route.color}; border-radius:4px; box-shadow:0 0 12px ${route.color}60;">${route.name}</div>`, 
          { sticky: true }
        );
      });

      // High-Altitude Strategic Passes
      const passes = [
        { name: 'Zoji La Pass (11,575 ft)', coords: [34.2800, 75.5000] },
        { name: 'Khardung La Pass (17,582 ft)', coords: [34.2787, 77.6047] }
      ];

      passes.forEach(p => {
        const passIcon = L.divIcon({
          className: 'pass-pin',
          html: `<div style="background:#101722; color:#d4b483; font-family:'JetBrains Mono',monospace; font-weight:bold; font-size:10px; padding:2px 8px; border-radius:4px; border:1px solid #d4b483; white-space:nowrap; box-shadow:0 0 10px rgba(212,180,131,0.4);">⛰️ ${p.name}</div>`,
          iconSize: [145, 22],
          iconAnchor: [72, 11]
        });
        L.marker(p.coords, { icon: passIcon }).addTo(map);
      });

      mapRef.current = map;
    }
  }, []);

  // Update Tile Layer on Mode Switch
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const layerConfig = mapMode === 'SATELLITE'
      ? {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri World Imagery &bull; DEFOPS Recon Satellite'
        }
      : {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap &bull; DEFOPS Tactical C4ISR'
        };

    const newLayer = L.tileLayer(layerConfig.url, {
      maxZoom: 19,
      attribution: layerConfig.attribution
    }).addTo(mapRef.current);

    tileLayerRef.current = newLayer;
  }, [mapMode]);

  // Update Convoy Markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    containers.forEach(container => {
      if (!container.location || !container.location.coordinates) return;
      const [lng, lat] = container.location.coordinates;
      const isBreach = container.status === 'COLD_CHAIN_BREACH';
      const color = isBreach ? '#ff3300' : '#00e655';

      const customIcon = L.divIcon({
        className: 'custom-convoy-marker',
        html: `
          <div style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.4; animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="width:28px; height:28px; border-radius:6px; background:#0b1118; border:2px solid ${color}; display:flex; align-items:center; justify-content:center; color:${color}; font-size:12px; font-weight:bold; box-shadow:0 0 14px ${color};">
              ${isBreach ? '⚠️' : '🚚'}
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
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
            <div style="font-size:11px; color:${isBreach ? '#ff5533' : '#00e655'}; font-weight:bold;">
              STATUS: ${container.status}
            </div>
            <div style="font-size:10px; color:#d1d5db; margin-top:3px; border-top:1px solid #27384e; padding-top:3px;">
              TEMP: <strong style="color:${isBreach ? '#ff5533' : '#00e655'}">${container.sensors?.temperature ?? '--'}°C</strong> | BAT: <strong>${container.sensors?.battery ?? '--'}%</strong>
            </div>
          </div>
        `);

        markersRef.current[container.containerId] = marker;
      }
    });

    if (!selectedNode && containers.length > 0) {
      setSelectedNode(containers[0]);
    }

  }, [containers]);

  return (
    <div className="space-y-4">
      {/* Map Card with Drone HUD Overlay - Tactical Ops Room */}
      <div className="bg-[#0b1017] border border-[#1e2a3c] rounded-lg overflow-hidden shadow-2xl relative hud-corner-brackets">
        
        {/* Header HUD Bar */}
        <div className="px-5 py-3 bg-[#0e141e] border-b border-[#1c2738] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Radio className="text-[#00e655] animate-pulse" size={18} />
            <h2 className="font-stencil font-bold text-lg text-white tracking-wider">
              GIS LOGISTICS THEATRE &bull; NORTHERN COMMAND AXIS
            </h2>
          </div>
          
          {/* Mode Switcher & Telemetry Badges */}
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <div className="flex bg-[#080d14] rounded p-0.5 border border-[#1e2b3c]">
              <button
                type="button"
                onClick={() => setMapMode('RADAR')}
                className={`px-2.5 py-1 rounded text-[11px] font-stencil font-bold tracking-wider transition-all cursor-pointer ${
                  mapMode === 'RADAR'
                    ? 'bg-[#1b3d22] text-[#00e655] border border-[#00e655]/40 shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🎯 TACTICAL RADAR
              </button>
              <button
                type="button"
                onClick={() => setMapMode('SATELLITE')}
                className={`px-2.5 py-1 rounded text-[11px] font-stencil font-bold tracking-wider transition-all cursor-pointer ${
                  mapMode === 'SATELLITE'
                    ? 'bg-[#ff6600] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🛰️ SATELLITE RECON
              </button>
            </div>

            <span className="text-[#d4b483] bg-[#d4b483]/10 border border-[#d4b483]/30 px-2.5 py-1 rounded hidden lg:inline">
              SATELLITE HUD // 34.45°N, 76.85°E
            </span>
            <span className="text-[#ff6600] border border-[#ff6600]/40 bg-[#ff6600]/10 px-2 py-1 rounded font-bold hidden sm:inline flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600] animate-ping"></span>
              LIVE TELEMETRY
            </span>
          </div>
        </div>

        {/* Drone HUD Compass Tape */}
        <div className="bg-[#090d14] border-b border-[#182332] px-4 py-1.5 flex items-center justify-center font-mono text-[10px] text-gray-500 select-none overflow-hidden">
          <div className="flex items-center gap-6 text-gray-400">
            <span>330°</span>
            <span>&bull;</span>
            <span>345°</span>
            <span>&bull;</span>
            <span className="text-[#ff6600] font-bold border-b-2 border-[#ff6600] px-1">N 000°</span>
            <span>&bull;</span>
            <span>015°</span>
            <span>&bull;</span>
            <span>030°</span>
            <span>&bull;</span>
            <span className="text-[#d4b483] font-bold">NE 045°</span>
            <span>&bull;</span>
            <span>060°</span>
          </div>
        </div>

        {/* Leaflet Map Div with High-Contrast Real-Time Tactical Mode */}
        <div className="relative overflow-hidden">
          <div 
            ref={mapContainerRef} 
            className={`w-full h-[540px] z-10 ${mapMode === 'RADAR' ? 'dark-tactical-map' : 'satellite-tactical-map'}`}
          ></div>

          {/* Animated Radar Sweep Overlay in Radar Mode */}
          {mapMode === 'RADAR' && (
            <div className="radar-sweep-beam"></div>
          )}

          {/* HUD Overlay Crosshairs in Corners */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none text-[#d4b483]/70 font-mono text-xs font-bold drop-shadow">
            ⌜ LAT 34°27'N
          </div>
          <div className="absolute top-3 right-3 z-20 pointer-events-none text-[#d4b483]/70 font-mono text-xs font-bold drop-shadow">
            LON 77°35'E ⌝
          </div>
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none text-[#00e655] font-mono text-xs font-bold drop-shadow flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00e655] animate-pulse"></span>
            <span>⌞ RADAR: ACTIVE SWEEP</span>
          </div>
          <div className="absolute bottom-3 right-3 z-20 pointer-events-none text-[#d4b483]/70 font-mono text-xs font-bold drop-shadow">
            GRID: 43X-LK ⌟
          </div>
        </div>
      </div>

      {/* Selected Node Details Box - Command Console */}
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
            <span className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${
              selectedNode.status === 'COLD_CHAIN_BREACH' 
                ? 'bg-red-950/80 text-red-400 border border-red-800 animate-pulse' 
                : 'bg-[#122316] text-[#00e655] border border-[#1b3d22]'
            }`}>
              {selectedNode.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#101722] p-3.5 rounded border border-[#1d2b3e]">
              <div className="flex items-center gap-1.5 text-[#d4b483] mb-1 font-stencil font-bold uppercase tracking-wider">
                <Thermometer size={14} className={selectedNode.sensors?.temperature > 25 ? 'text-red-500 animate-pulse' : 'text-[#ff6600]'} />
                <span>CORE TEMP</span>
              </div>
              <div className={`font-mono text-xl font-bold ${selectedNode.sensors?.temperature > 25 ? 'text-red-500' : 'text-white'}`}>
                {selectedNode.sensors?.temperature ?? '--'}°C
              </div>
              <span className="text-[10px] text-gray-500 font-mono">CRIT LIMIT: &le; 25.0°C</span>
            </div>

            <div className="bg-[#101722] p-3.5 rounded border border-[#1d2b3e]">
              <div className="flex items-center gap-1.5 text-[#d4b483] mb-1 font-stencil font-bold uppercase tracking-wider">
                <Droplets size={14} className="text-sky-400" />
                <span>SEALED HUMIDITY</span>
              </div>
              <div className="font-mono text-xl font-bold text-white">
                {selectedNode.sensors?.humidity ?? '--'}%
              </div>
              <span className="text-[10px] text-gray-500 font-mono">SEAL INTEGRITY: NOMINAL</span>
            </div>

            <div className="bg-[#101722] p-3.5 rounded border border-[#1d2b3e]">
              <div className="flex items-center gap-1.5 text-[#d4b483] mb-1 font-stencil font-bold uppercase tracking-wider">
                <Battery size={14} className="text-[#00e655]" />
                <span>SOLAR BATTERY</span>
              </div>
              <div className="font-mono text-xl font-bold text-white">
                {selectedNode.sensors?.battery ?? '--'}%
              </div>
              <span className="text-[10px] text-gray-500 font-mono">SOLAR BUFFER: 48H RESERVE</span>
            </div>

            <div className="bg-[#101722] p-3.5 rounded border border-[#1d2b3e]">
              <div className="flex items-center gap-1.5 text-[#d4b483] mb-1 font-stencil font-bold uppercase tracking-wider">
                <Mountain size={14} className="text-[#d4b483]" />
                <span>CORRIDOR AXIS</span>
              </div>
              <div className="font-mono text-sm font-bold text-emerald-400 mt-1">
                ZOJI LA PASSABLE
              </div>
              <span className="text-[10px] text-gray-500 font-mono">CHAIN CONVOYS ARMED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
