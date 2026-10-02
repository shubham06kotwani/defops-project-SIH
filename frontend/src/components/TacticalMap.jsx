import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Thermometer, Battery, Droplets, Navigation, Mountain } from 'lucide-react';

const STRATEGIC_CORRIDORS = [
  {
    name: 'NH-1D Axis (Srinagar - Dras - Kargil)',
    points: [
      [34.0837, 74.7973], // Srinagar
      [34.2800, 75.5000], // Zoji La
      [34.4300, 75.7600], // Dras
      [34.5539, 76.1349]  // Kargil
    ],
    color: '#0284c7'
  },
  {
    name: 'Kargil - Leh Forward Line',
    points: [
      [34.5539, 76.1349], // Kargil
      [34.2980, 76.8290], // Lamayuru
      [34.1526, 77.5771]  // Leh
    ],
    color: '#16a34a'
  },
  {
    name: 'Leh - Khardung La - Siachen Axis',
    points: [
      [34.1526, 77.5771], // Leh
      [34.2787, 77.6047], // Khardung La
      [34.6150, 77.4600], // Diskit
      [35.1970, 77.1700]  // Siachen Base
    ],
    color: '#d97706'
  }
];

export default function TacticalMap({ containers, onSelectContainer }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [34.45, 76.85],
        zoom: 8,
        minZoom: 6,
        maxZoom: 16
      });

      // Standard Clean OpenStreetMap Tile Layer
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Draw Supply Corridors
      STRATEGIC_CORRIDORS.forEach(route => {
        L.polyline(route.points, {
          color: route.color,
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8'
        }).addTo(map).bindTooltip(`<strong>${route.name}</strong>`, { sticky: true });
      });

      // Mountain Passes
      const passes = [
        { name: 'Zoji La Pass (11,575 ft)', coords: [34.2800, 75.5000] },
        { name: 'Khardung La Pass (17,582 ft)', coords: [34.2787, 77.6047] }
      ];

      passes.forEach(p => {
        const passIcon = L.divIcon({
          className: 'pass-pin',
          html: `<div style="background:#fff; color:#b45309; font-weight:bold; font-size:11px; padding:3px 7px; border-radius:6px; border:2px solid #d97706; white-space:nowrap; box-shadow:0 3px 8px rgba(0,0,0,0.15);">⛰️ ${p.name}</div>`,
          iconSize: [130, 22],
          iconAnchor: [65, 11]
        });
        L.marker(p.coords, { icon: passIcon }).addTo(map);
      });

      mapRef.current = map;
    }

    const map = mapRef.current;

    containers.forEach(container => {
      if (!container.location || !container.location.coordinates) return;
      const [lng, lat] = container.location.coordinates;
      const isBreach = container.status === 'COLD_CHAIN_BREACH';
      const color = isBreach ? '#dc2626' : '#16a34a';

      const customIcon = L.divIcon({
        className: 'custom-convoy-marker',
        html: `
          <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.25; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="width:28px; height:28px; border-radius:50%; background:#ffffff; border:2.5px solid ${color}; display:flex; align-items:center; justify-content:center; color:${color}; font-size:13px; font-weight:bold; box-shadow:0 2px 10px rgba(0,0,0,0.2);">
              ${isBreach ? '⚠️' : '🚚'}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
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
          <div style="padding:4px; font-family:sans-serif;">
            <div style="font-weight:bold; font-size:14px; color:#111827;">${container.containerId}</div>
            <div style="font-size:12px; color:#4b5563; margin-bottom:4px;">${container.baseName || 'Convoy Transit'}</div>
            <div style="font-size:12px; color:${isBreach ? '#dc2626' : '#16a34a'}; font-weight:bold;">
              Status: ${container.status}
            </div>
            <div style="font-size:11px; color:#374151; margin-top:2px;">
              Temp: <strong>${container.sensors?.temperature ?? '--'}°C</strong> | Bat: <strong>${container.sensors?.battery ?? '--'}%</strong>
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
    <div className="space-y-5">
      {/* Map Card */}
      <div className="bg-white border border-emerald-100/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-50/70 via-white to-white border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Navigation className="text-[#2d6a4f]" size={20} />
            <h2 className="font-tactical font-bold text-xl text-gray-900 tracking-wide">
              TACTICAL GIS MAP &bull; NORTHERN COMMAND CORRIDOR
            </h2>
          </div>
          <span className="text-xs font-mono text-[#2d6a4f] bg-emerald-100/60 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
            OpenStreetMap GIS Integration
          </span>
        </div>

        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-[520px] z-10"></div>
      </div>

      {/* Selected Node Details Box */}
      {selectedNode && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#2d6a4f]">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="font-tactical font-bold text-xl text-gray-900">
                  {selectedNode.containerId} &bull; <span className="text-gray-600 font-sans text-sm font-normal">{selectedNode.baseName || 'In Transit'}</span>
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  Coordinates: {selectedNode.location?.coordinates ? `${selectedNode.location.coordinates[1].toFixed(4)}°N, ${selectedNode.location.coordinates[0].toFixed(4)}°E` : 'GPS Ingestion Active'}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
              selectedNode.status === 'COLD_CHAIN_BREACH' 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {selectedNode.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#f4f8f5] p-3.5 rounded-xl border border-emerald-100/80">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Thermometer size={16} className={selectedNode.sensors?.temperature > 25 ? 'text-red-500' : 'text-[#2d6a4f]'} />
                <span className="font-semibold">TEMPERATURE</span>
              </div>
              <div className={`font-mono text-xl font-bold ${selectedNode.sensors?.temperature > 25 ? 'text-red-600' : 'text-gray-900'}`}>
                {selectedNode.sensors?.temperature ?? '--'}°C
              </div>
              <span className="text-[10px] text-gray-400">Max limit: 25.0°C</span>
            </div>

            <div className="bg-[#f4f8f5] p-3.5 rounded-xl border border-emerald-100/80">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Droplets size={16} className="text-cyan-600" />
                <span className="font-semibold">HUMIDITY</span>
              </div>
              <div className="font-mono text-xl font-bold text-gray-900">
                {selectedNode.sensors?.humidity ?? '--'}%
              </div>
              <span className="text-[10px] text-gray-400">Ambient sealed container</span>
            </div>

            <div className="bg-[#f4f8f5] p-3.5 rounded-xl border border-emerald-100/80">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Battery size={16} className="text-amber-600" />
                <span className="font-semibold">IOT BATTERY</span>
              </div>
              <div className="font-mono text-xl font-bold text-gray-900">
                {selectedNode.sensors?.battery ?? '--'}%
              </div>
              <span className="text-[10px] text-gray-400">Solar buffer charging</span>
            </div>

            <div className="bg-[#f4f8f5] p-3.5 rounded-xl border border-emerald-100/80">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Mountain size={16} className="text-[#2d6a4f]" />
                <span className="font-semibold">CORRIDOR PASS</span>
              </div>
              <div className="font-sans text-sm font-bold text-[#1b4332] mt-1">
                Zoji La Axis Passable
              </div>
              <span className="text-[10px] text-gray-400">Chained convoys allowed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
