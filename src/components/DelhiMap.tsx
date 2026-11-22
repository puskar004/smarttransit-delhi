import L from 'leaflet';
import { Compass } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { DELHI_SEGMENTS, DELHI_STOPS, OPERATOR_META, STOP_BY_ID } from '../data/delhiNetwork';
import { trafficLevelColor, trafficLevelLabel } from '../engine/trafficModel';
import type { PlannedJourney, SegmentTrafficState, SimulatedBus, TrafficLevel } from '../types/transit';

interface DelhiMapProps {
  mode: 'PLANNER' | 'TRAFFIC' | 'RADAR';
  trafficStates: Record<string, SegmentTrafficState>;
  buses: SimulatedBus[];
  activeJourney: PlannedJourney | null;
  originStopId: string;
  destinationStopId: string;
  selectedSegmentId: string | null;
  trackedBusId?: string | null;
  onSelectSegment: (segmentId: string) => void;
  onSelectStop: (stopId: string) => void;
  onSelectBus?: (vehicleId: string) => void;
}

interface UndirectedMapLink {
  key: string;
  fwdId: string;
  revId: string;
  coords: [number, number][];
  corridorName: string;
  fromName: string;
  toName: string;
}

const UNDIRECTED_MAP_LINKS: UndirectedMapLink[] = (() => {
  const seen = new Set<string>();
  const links: UndirectedMapLink[] = [];
  for (const seg of DELHI_SEGMENTS) {
    const sortedKey = [seg.fromStopId, seg.toStopId].sort().join('--');
    if (seen.has(sortedKey)) continue;
    seen.add(sortedKey);
    links.push({
      key: sortedKey,
      fwdId: seg.id,
      revId: `${seg.toStopId}__${seg.fromStopId}`,
      coords: seg.waypoints.map((w) => [w.lat, w.lng] as [number, number]),
      corridorName: seg.corridorName,
      fromName: STOP_BY_ID[seg.fromStopId]?.name ?? seg.fromStopId,
      toName: STOP_BY_ID[seg.toStopId]?.name ?? seg.toStopId,
    });
  }
  return links;
})();

const SEGMENT_COORDS: Record<string, [number, number][]> = Object.fromEntries(
  DELHI_SEGMENTS.map((seg) => [seg.id, seg.waypoints.map((w) => [w.lat, w.lng] as [number, number])])
);

export function DelhiMap({
  mode,
  trafficStates,
  buses,
  activeJourney,
  originStopId,
  destinationStopId,
  selectedSegmentId,
  trackedBusId,
  onSelectSegment,
  onSelectStop,
  onSelectBus,
}: DelhiMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const linkLayersRef = useRef<Map<string, L.Polyline>>(new Map());
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const stopLayerRef = useRef<L.LayerGroup | null>(null);
  const busLayerRef = useRef<L.LayerGroup | null>(null);

  const callbacksRef = useRef({ onSelectSegment, onSelectStop, onSelectBus });
  callbacksRef.current = { onSelectSegment, onSelectStop, onSelectBus };

  const lastFittedEndpointsRef = useRef<string>('');
  const lastTrackedBusCenterRef = useRef<string>('');

  // 1. Initialize Leaflet map with Dark Matter tiles once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [28.568, 77.232],
      zoom: 12,
      minZoom: 11,
      maxZoom: 16,
      zoomControl: false,
      preferCanvas: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // High-contrast Dark Gray Basemap with ZERO watermarks
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri &mdash; Delhi Transport Stack Live Map',
        maxZoom: 16,
      }
    ).addTo(map);

    map.createPane('networkPane');
    map.getPane('networkPane')!.style.zIndex = '410';

    map.createPane('routePane');
    map.getPane('routePane')!.style.zIndex = '450';

    map.createPane('stopPane');
    map.getPane('stopPane')!.style.zIndex = '520';

    map.createPane('busPane');
    map.getPane('busPane')!.style.zIndex = '560';

    const routeGroup = L.layerGroup([], { pane: 'routePane' }).addTo(map);
    const stopGroup = L.layerGroup([], { pane: 'stopPane' }).addTo(map);
    const busGroup = L.layerGroup([], { pane: 'busPane' }).addTo(map);

    routeLayerRef.current = routeGroup;
    stopLayerRef.current = stopGroup;
    busLayerRef.current = busGroup;

    // Base network lines
    const linkMap = new Map<string, L.Polyline>();
    for (const link of UNDIRECTED_MAP_LINKS) {
      const line = L.polyline(link.coords, {
        pane: 'networkPane',
        color: '#262B3A',
        weight: 3.5,
        opacity: 0.75,
        lineCap: 'round',
        lineJoin: 'round',
      })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          callbacksRef.current.onSelectSegment(link.fwdId);
        })
        .bindTooltip(
          `<div style="font-weight:700">${link.fromName} ↔ ${link.toName}</div>
           <div style="color:#94A3B8;font-size:11px">${link.corridorName}</div>`,
          { sticky: true, className: 'pravaah-dark-tooltip' }
        )
        .addTo(map);

      linkMap.set(link.key, line);
    }
    linkLayersRef.current = linkMap;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Color road network based on live traffic / speed
  useEffect(() => {
    const linkMap = linkLayersRef.current;
    if (linkMap.size === 0) return;

    for (const link of UNDIRECTED_MAP_LINKS) {
      const line = linkMap.get(link.key);
      if (!line) continue;

      const fwdState = trafficStates[link.fwdId];
      const revState = trafficStates[link.revId];

      if (mode === 'PLANNER') {
        const isSelected = selectedSegmentId === link.fwdId || selectedSegmentId === link.revId;
        line.setStyle({
          color: isSelected ? '#00E5FF' : '#2A3042',
          weight: isSelected ? 5 : 2.5,
          opacity: isSelected ? 0.95 : 0.45,
        });
      } else {
        const worstSpeed = Math.min(
          fwdState ? fwdState.currentSpeedKmh : 35,
          revState ? revState.currentSpeedKmh : 35
        );
        const worstLevel: TrafficLevel =
          worstSpeed < 10
            ? 'SEVERE'
            : worstSpeed < 18
              ? 'HEAVY'
              : worstSpeed < 26
                ? 'MODERATE'
                : 'FREE_FLOW';

        const color = trafficLevelColor(worstLevel);
        const isSelected = selectedSegmentId === link.fwdId || selectedSegmentId === link.revId;

        line.setStyle({
          color: isSelected ? '#00E5FF' : color,
          weight: isSelected ? 6 : worstLevel === 'SEVERE' ? 5 : 3.5,
          opacity: isSelected ? 1 : worstLevel === 'SEVERE' ? 0.95 : 0.75,
        });

        line.setTooltipContent(
          `<div style="font-weight:700">${link.fromName} ↔ ${link.toName}</div>
           <div style="color:#94A3B8;font-size:11px">${link.corridorName}</div>
           <div style="font-family:'JetBrains Mono',monospace;font-size:11px;margin-top:2px;color:${color}">${worstSpeed.toFixed(0)} km/h · ${trafficLevelLabel(worstLevel)}</div>`
        );
      }
    }
  }, [trafficStates, mode, selectedSegmentId]);

  // 3. Highlight Active Journey OR Tracked Bus Route
  useEffect(() => {
    const routeGroup = routeLayerRef.current;
    const stopGroup = stopLayerRef.current;
    if (!routeGroup || !stopGroup) return;

    routeGroup.clearLayers();
    stopGroup.clearLayers();

    // A. Priority 1: If user is Live Tracking a specific bus
    if (trackedBusId) {
      const trackedBus = buses.find((b) => b.vehicleId === trackedBusId);
      if (trackedBus) {
        const routeStops = trackedBus.stopSequence;
        const allBoundsCoords: [number, number][] = [];

        // Draw segments along tracked route
        for (let i = 0; i < routeStops.length - 1; i++) {
          const fromId = routeStops[i];
          const toId = routeStops[i + 1];
          const segId = `${fromId}__${toId}`;
          const coords = SEGMENT_COORDS[segId];
          if (!coords) continue;
          allBoundsCoords.push(...coords);

          // Deep neon outer glow (Cyan AI theme)
          L.polyline(coords, {
            pane: 'routePane',
            color: '#00E5FF',
            weight: 12,
            opacity: 0.3,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: false,
          }).addTo(routeGroup);

          // High-contrast primary route stroke
          L.polyline(coords, {
            pane: 'routePane',
            color: '#00E5FF',
            weight: 5.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(routeGroup);
        }

        // Draw stops along tracked route
        routeStops.forEach((sId) => {
          const stop = STOP_BY_ID[sId];
          if (!stop) return;
          const isNext = sId === trackedBus.nextStopId;

          L.circleMarker([stop.lat, stop.lng], {
            pane: 'stopPane',
            radius: isNext ? 8 : 5,
            fillColor: isNext ? '#00E5FF' : '#1E222D',
            color: isNext ? '#FFFFFF' : '#38BDF8',
            weight: isNext ? 3 : 2,
            fillOpacity: 1,
          })
            .bindTooltip(
              `<b>${stop.name}</b>${isNext ? '<br/><span style="color:#00E5FF;font-weight:bold">APPROACHING NEXT STOP</span>' : ''}`,
              { direction: 'top', offset: [0, -6], className: 'pravaah-dark-tooltip' }
            )
            .addTo(stopGroup);
        });

        // Center map on tracked bus initially
        if (mapRef.current && lastTrackedBusCenterRef.current !== trackedBus.vehicleId) {
          lastTrackedBusCenterRef.current = trackedBus.vehicleId;
          mapRef.current.flyTo([trackedBus.lat, trackedBus.lng], 14, {
            animate: true,
            duration: 0.8,
          });
        }
        return;
      }
    }

    // B. Mode PLANNER: Highlight planned multimodal journey
    if (mode === 'PLANNER' && activeJourney) {
      const routeStopIds = new Set<string>();
      const allBoundsCoords: [number, number][] = [];

      for (const leg of activeJourney.legs) {
        if (leg.type === 'BUS' && leg.segments) {
          for (const seg of leg.segments) {
            routeStopIds.add(seg.fromStopId);
            routeStopIds.add(seg.toStopId);
            const coords = SEGMENT_COORDS[seg.segmentId];
            if (!coords) continue;
            allBoundsCoords.push(...coords);

            // Deep neon outer glow (Netflix style)
            L.polyline(coords, {
              pane: 'routePane',
              color: '#00E5FF',
              weight: 12,
              opacity: 0.22,
              lineCap: 'round',
              lineJoin: 'round',
              interactive: false,
            }).addTo(routeGroup);

            // Core high-contrast route line
            L.polyline(coords, {
              pane: 'routePane',
              color: trafficLevelColor(seg.level),
              weight: 6,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
            })
              .on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                callbacksRef.current.onSelectSegment(seg.segmentId);
              })
              .bindTooltip(
                `<div style="font-weight:700">${seg.fromStopName} → ${seg.toStopName}</div>
                 <div style="font-family:'JetBrains Mono',monospace;font-size:11px;margin-top:2px;color:#38BDF8">${seg.speedKmh.toFixed(0)} km/h · ${trafficLevelLabel(seg.level)}</div>`,
                { sticky: true, className: 'pravaah-dark-tooltip' }
              )
              .addTo(routeGroup);
          }
        } else if (leg.type === 'TRANSFER_WALK') {
          const from = STOP_BY_ID[leg.fromStopId];
          const to = STOP_BY_ID[leg.toStopId];
          if (from && to && from.id !== to.id) {
            L.polyline(
              [
                [from.lat, from.lng],
                [to.lat, to.lng],
              ],
              {
                pane: 'routePane',
                color: '#F59E0B',
                weight: 4,
                dashArray: '5 7',
                interactive: false,
              }
            ).addTo(routeGroup);
          }
        }
      }

      // Draw stops on this route
      for (const sId of routeStopIds) {
        const stop = STOP_BY_ID[sId];
        if (!stop) continue;
        const isEnd = sId === originStopId || sId === destinationStopId;
        if (isEnd) continue;

        L.circleMarker([stop.lat, stop.lng], {
          pane: 'stopPane',
          radius: 5,
          fillColor: '#1E222D',
          color: '#00E5FF',
          weight: 2,
          fillOpacity: 1,
        })
          .bindTooltip(`<b>${stop.name}</b>`, {
            direction: 'top',
            offset: [0, -6],
            className: 'pravaah-dark-tooltip',
          })
          .addTo(stopGroup);
      }

      // Origin Pin (Glowing Emerald)
      const origin = STOP_BY_ID[originStopId];
      const dest = STOP_BY_ID[destinationStopId];

      if (origin) {
        L.circleMarker([origin.lat, origin.lng], {
          pane: 'stopPane',
          radius: 7,
          fillColor: '#10B981',
          color: '#FFFFFF',
          weight: 3,
          fillOpacity: 1,
        }).addTo(stopGroup);

        L.marker([origin.lat, origin.lng], {
          pane: 'busPane',
          interactive: false,
          icon: L.divIcon({
            className: '',
            html: `<div style="transform:translate(-50%,-145%);display:inline-flex;align-items:center;gap:6px;background:#10B981;color:#000;font-size:12px;font-weight:800;padding:4px 10px;border-radius:8px;white-space:nowrap;border:2px solid #fff;box-shadow:0 0 20px rgba(16,185,129,0.7)">FROM · ${origin.name}</div>`,
            iconSize: [0, 0],
          }),
        }).addTo(routeGroup);
      }

      // Destination Pin (Volt Accent)
      if (dest) {
        L.circleMarker([dest.lat, dest.lng], {
          pane: 'stopPane',
          radius: 7,
          fillColor: '#CCFF00',
          color: '#000000',
          weight: 3,
          fillOpacity: 1,
        }).addTo(stopGroup);

        L.marker([dest.lat, dest.lng], {
          pane: 'busPane',
          interactive: false,
          icon: L.divIcon({
            className: '',
            html: `<div style="transform:translate(-50%,-145%);display:inline-flex;align-items:center;gap:6px;background:#CCFF00;color:#000;font-size:11px;font-weight:900;padding:4px 10px;border-radius:6px;white-space:nowrap;border:2px solid #000;box-shadow:0 0 20px rgba(204,255,0,0.85);font-family:'Plus Jakarta Sans',sans-serif;text-transform:uppercase;letter-spacing:0.05em">TO · ${dest.name}</div>`,
            iconSize: [0, 0],
          }),
        }).addTo(routeGroup);
      }

      // Auto-fit bounds smoothly
      const pairKey = `${originStopId}->${destinationStopId}`;
      if (mapRef.current && allBoundsCoords.length > 1 && lastFittedEndpointsRef.current !== pairKey) {
        lastFittedEndpointsRef.current = pairKey;
        mapRef.current.fitBounds(L.latLngBounds(allBoundsCoords).pad(0.24), {
          maxZoom: 13.5,
          animate: true,
          duration: 0.55,
        });
      }
    } else {
      // In Traffic/Radar mode, show major Delhi transit hubs
      for (const stop of DELHI_STOPS.filter((s) => s.isHub)) {
        L.circleMarker([stop.lat, stop.lng], {
          pane: 'stopPane',
          radius: 5,
          fillColor: '#1E222D',
          color: '#38BDF8',
          weight: 2,
          fillOpacity: 1,
        })
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            callbacksRef.current.onSelectStop(stop.id);
          })
          .bindTooltip(`<b>${stop.name}</b><br/><span style="color:#94A3B8">Click for live arrival board</span>`, {
            direction: 'top',
            offset: [0, -6],
            className: 'pravaah-dark-tooltip',
          })
          .addTo(stopGroup);
      }
    }
  }, [mode, activeJourney, originStopId, destinationStopId, trackedBusId, buses]);

  // 4. Draw moving live buses with passenger occupancy badges & Live Track pulse
  useEffect(() => {
    const busGroup = busLayerRef.current;
    if (!busGroup) return;
    busGroup.clearLayers();

    // When a bus is being live tracked
    if (trackedBusId) {
      const trackedBus = buses.find((b) => b.vehicleId === trackedBusId);
      if (trackedBus) {
        const occ = Math.round(((trackedBus.passengersEst ?? 30) / 60) * 100);
        const crowdColor = occ < 45 ? '#CCFF00' : occ < 75 ? '#FFB800' : '#FFFFFF';

        L.marker([trackedBus.lat, trackedBus.lng], {
          pane: 'busPane',
          icon: L.divIcon({
            className: 'bus-smooth-marker',
            html: `<div style="transform:translate(-50%,-50%);position:relative;display:inline-flex;align-items:center;gap:6px;background:#0F121C;color:#fff;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:900;padding:6px 12px;border-radius:12px;border:2.5px solid #00E5FF;box-shadow:0 0 28px rgba(0,229,255,0.9);white-space:nowrap;z-index:999">
              <span class="animate-ping" style="position:absolute;inset:-6px;border-radius:14px;border:2px solid #00E5FF;opacity:0.75;pointer-events:none"></span>
              <span style="color:#00E5FF;font-size:14px">🎯</span>
              <span>BUS ${trackedBus.routeShortName}</span>
              <span style="color:#94A3B8;font-size:11px">(${trackedBus.vehicleId})</span>
              <span style="width:8px;height:8px;border-radius:50%;background:${crowdColor}"></span>
              <span style="color:${crowdColor};font-size:11px">${occ}%</span>
            </div>`,
            iconSize: [0, 0],
          }),
        })
          .bindTooltip(
            `<b>LIVE TRACKING: Bus ${trackedBus.routeShortName}</b> (${trackedBus.vehicleId})<br/>Occupancy: <span style="color:${crowdColor}"><b>${occ}% full</b></span><br/>Speed: ${trackedBus.speedKmh.toFixed(0)} km/h · Next: ${trackedBus.nextStopName}`,
            { direction: 'top', offset: [0, -12], className: 'pravaah-dark-tooltip' }
          )
          .addTo(busGroup);
      }
      return;
    }

    if (mode === 'PLANNER' && activeJourney) {
      const activeRouteIds = new Set(
        activeJourney.legs.filter((l) => l.type === 'BUS' && l.routeId).map((l) => l.routeId!)
      );
      const relevantBuses = buses.filter((b) => activeRouteIds.has(b.routeId));

      for (const bus of relevantBuses) {
        const meta = OPERATOR_META[bus.operator];
        const occ = Math.round(((bus.passengersEst ?? 30) / 60) * 100);
        const crowdColor = occ < 45 ? '#CCFF00' : occ < 75 ? '#FFB800' : '#FFFFFF';

        L.marker([bus.lat, bus.lng], {
          pane: 'busPane',
          icon: L.divIcon({
            className: 'bus-smooth-marker',
            html: `<div style="transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:5px;background:#151821;color:#fff;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;padding:4px 8px;border-radius:8px;border:2px solid ${meta.color};box-shadow:0 0 15px rgba(0,0,0,0.8);white-space:nowrap;cursor:pointer">
              <span style="color:${meta.color}">🚌</span>
              <span>${bus.routeShortName}</span>
              <span style="width:7px;height:7px;border-radius:50%;background:${crowdColor};box-shadow:0 0 8px ${crowdColor}"></span>
              <span style="color:#94A3B8;font-size:10px">${occ}%</span>
            </div>`,
            iconSize: [0, 0],
          }),
        })
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (callbacksRef.current.onSelectBus) {
              callbacksRef.current.onSelectBus(bus.vehicleId);
            }
          })
          .bindTooltip(
            `<b>Bus ${bus.routeShortName}</b> (${bus.vehicleId})<br/>Occupancy: <span style="color:${crowdColor}"><b>${occ}% full</b></span> (${bus.passengersEst} pax)<br/>Speed: ${bus.isDwelling ? 'Boarding at stop' : `${bus.speedKmh.toFixed(0)} km/h`}<br/><span style="color:#00E5FF;font-weight:bold">Click to Live Track</span>`,
            { direction: 'top', offset: [0, -10], className: 'pravaah-dark-tooltip' }
          )
          .addTo(busGroup);
      }
    } else {
      // In Traffic & Radar mode, show probes
      buses.forEach((bus, idx) => {
        if (idx % 3 !== 0) return;
        const occ = Math.round(((bus.passengersEst ?? 30) / 60) * 100);
        const crowdColor = occ < 45 ? '#CCFF00' : occ < 75 ? '#FFB800' : '#FFFFFF';

        L.circleMarker([bus.lat, bus.lng], {
          pane: 'busPane',
          radius: 5,
          fillColor: crowdColor,
          color: '#FFFFFF',
          weight: 2,
          fillOpacity: 0.95,
        })
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (callbacksRef.current.onSelectBus) {
              callbacksRef.current.onSelectBus(bus.vehicleId);
            }
          })
          .bindTooltip(
            `<b>Route ${bus.routeShortName}</b> (${bus.vehicleId})<br/>Crowd: <b>${occ}%</b> · Speed: ${bus.speedKmh.toFixed(0)} km/h<br/><span style="color:#00E5FF">Click to Live Track</span>`,
            { direction: 'top', offset: [0, -6], className: 'pravaah-dark-tooltip' }
          )
          .addTo(busGroup);
      });
    }
  }, [mode, buses, activeJourney, trackedBusId]);

  // 5. Gently pan to selected segment
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSegmentId || mode === 'PLANNER') return;
    const coords = SEGMENT_COORDS[selectedSegmentId];
    if (!coords || coords.length < 2) return;
    map.flyToBounds(L.latLngBounds(coords).pad(0.9), { maxZoom: 14, duration: 0.5 });
  }, [selectedSegmentId, mode]);

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([28.568, 77.232], 12, { duration: 0.8 });
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      {/* Floating Recenter Map Button */}
      <button
        type="button"
        onClick={handleRecenter}
        aria-label="Recenter map to central Delhi"
        title="Recenter Map View"
        className="absolute top-24 right-3 z-[400] w-8 h-8 rounded-lg bg-[#121620]/90 hover:bg-[#1a2130] border border-[#2b3348] hover:border-[#CCFF00] text-slate-300 hover:text-[#CCFF00] flex items-center justify-center transition-all shadow-lg backdrop-blur-md cursor-pointer"
      >
        <Compass className="w-4 h-4 stroke-[2.2]" />
      </button>
    </div>
  );
}
