import type { RoadSegment, SegmentTrafficState } from '../types/transit';

interface DiurnalChartProps {
  segment: RoadSegment;
  state: SegmentTrafficState;
  simHour: number;
}

/**
 * Hand-crafted crisp SVG chart displaying:
 * 1. 24-hour historical diurnal speed curve for this Delhi corridor segment
 * 2. Free-flow ceiling line & scheduled GTFS line
 * 3. Current Kalman-filtered live speed marker + 60-minute forecast projection
 */
export function DiurnalChart({ segment, state, simHour }: DiurnalChartProps) {
  const width = 332;
  const height = 112;
  const padL = 28;
  const padR = 10;
  const padT = 10;
  const padB = 20;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxSpeed = Math.max(segment.freeFlowSpeedKmh * 1.08, 46);
  const xForHour = (h: number) => padL + ((h % 24) / 23) * plotW;
  const yForSpeed = (v: number) => padT + plotH - (Math.max(0, Math.min(maxSpeed, v)) / maxSpeed) * plotH;

  const histPoints = segment.diurnalFactor.map((f, h) => {
    const v = segment.freeFlowSpeedKmh * f;
    return `${xForHour(h).toFixed(1)},${yForSpeed(v).toFixed(1)}`;
  });

  const histPath = `M ${histPoints.join(' L ')}`;
  const areaPath = `${histPath} L ${xForHour(23).toFixed(1)},${(padT + plotH).toFixed(1)} L ${xForHour(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  const clampedHour = Math.max(0, Math.min(23, simHour));
  const curX = xForHour(clampedHour);
  const curY = yForSpeed(state.currentSpeedKmh);
  const schedY = yForSpeed(segment.scheduledSpeedKmh);

  // Build +15m..+60m forecast polyline if within 23h visual range
  const forecastPoints: string[] = [`${curX.toFixed(1)},${curY.toFixed(1)}`];
  const offsets = [0.25, 0.5, 0.75, 1.0];
  state.forecastSpeedsKmh.forEach((v, idx) => {
    const fh = Math.min(23, clampedHour + offsets[idx]);
    forecastPoints.push(`${xForHour(fh).toFixed(1)},${yForSpeed(v).toFixed(1)}`);
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block select-none">
      {/* Horizontal gridlines */}
      {[10, 20, 30, 40].map((v) => {
        if (v > maxSpeed) return null;
        const y = yForSpeed(v);
        return (
          <g key={v}>
            <line
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke="#ECEAE3"
              strokeWidth="1"
            />
            <text
              x={padL - 5}
              y={y + 3}
              textAnchor="end"
              fontSize="8.5"
              fill="#767E87"
              className="font-mono-tabular"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Peak hour shading bands (8:30-10:30 AM & 17:30-20:30 PM) */}
      <rect
        x={xForHour(8.5)}
        y={padT}
        width={xForHour(10.5) - xForHour(8.5)}
        height={plotH}
        fill="#D45815"
        opacity="0.06"
      />
      <rect
        x={xForHour(17.5)}
        y={padT}
        width={xForHour(20.5) - xForHour(17.5)}
        height={plotH}
        fill="#d97706"
        opacity="0.06"
      />

      {/* Scheduled GTFS baseline dashed line */}
      <line
        x1={padL}
        y1={schedY}
        x2={width - padR}
        y2={schedY}
        stroke="#8E96A0"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Historical diurnal curve fill + stroke */}
      <path d={areaPath} fill="#1553B7" opacity="0.07" />
      <path d={histPath} fill="none" stroke="#1553B7" strokeWidth="1.5" opacity="0.55" />

      {/* Current time vertical hairline */}
      <line
        x1={curX}
        y1={padT}
        x2={curX}
        y2={padT + plotH}
        stroke="#14171A"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.35"
      />

      {/* 60-min forecast dashed projection */}
      <polyline
        points={forecastPoints.join(' ')}
        fill="none"
        stroke="#D45815"
        strokeWidth="2"
        strokeDasharray="3 2"
      />

      {/* Current Kalman-filtered live point */}
      <circle cx={curX} cy={curY} r="4.2" fill="#FFFFFF" stroke="#14171A" strokeWidth="2" />
      <circle cx={curX} cy={curY} r="1.8" fill="#D45815" />

      {/* X-axis ticks */}
      {[0, 6, 12, 18, 23].map((h) => (
        <text
          key={h}
          x={xForHour(h)}
          y={height - 5}
          textAnchor="middle"
          fontSize="8.5"
          fill="#767E87"
          className="font-mono-tabular"
        >
          {String(h).padStart(2, '0')}h
        </text>
      ))}
    </svg>
  );
}

interface ProbeSparklineProps {
  state: SegmentTrafficState;
}

/**
 * Raw GPS bus probe scatter vs 1D Kalman filtered speed trajectory for the selected segment.
 */
export function ProbeKalmanChart({ state }: ProbeSparklineProps) {
  const history = state.probeHistory;
  if (history.length < 2) {
    return (
      <div className="h-[78px] flex items-center justify-center text-[11px] text-[#767E87] bg-[#F9F8F5] rounded border border-[#E4E2DA]">
        Waiting for next bus GPS probe on this segment...
      </div>
    );
  }

  const width = 332;
  const height = 82;
  const padL = 26;
  const padR = 8;
  const padT = 8;
  const padB = 14;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const allVals = history.flatMap((p) => [p.observedSpeedKmh, p.filteredSpeedKmh]);
  const maxV = Math.max(state.freeFlowSpeedKmh * 0.9, ...allVals, 25);
  const minV = Math.max(0, Math.min(...allVals) - 4);
  const range = Math.max(8, maxV - minV);

  const xAt = (i: number) => padL + (i / (history.length - 1)) * plotW;
  const yAt = (v: number) => padT + plotH - ((v - minV) / range) * plotH;

  const filteredLine = history
    .map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.filteredSpeedKmh).toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block select-none">
      {/* Y axis bounds */}
      <line x1={padL} y1={padT} x2={width - padR} y2={padT} stroke="#ECEAE3" strokeWidth="1" />
      <line
        x1={padL}
        y1={padT + plotH}
        x2={width - padR}
        y2={padT + plotH}
        stroke="#ECEAE3"
        strokeWidth="1"
      />
      <text x={padL - 4} y={padT + 4} textAnchor="end" fontSize="8" fill="#767E87" className="font-mono-tabular">
        {Math.round(maxV)}
      </text>
      <text x={padL - 4} y={padT + plotH} textAnchor="end" fontSize="8" fill="#767E87" className="font-mono-tabular">
        {Math.round(minV)}
      </text>

      {/* Historical prior reference */}
      <line
        x1={padL}
        y1={yAt(state.historicalSpeedKmh)}
        x2={width - padR}
        y2={yAt(state.historicalSpeedKmh)}
        stroke="#94A3B8"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Raw noisy GPS observations (dots) */}
      {history.map((p, i) => (
        <circle
          key={`${p.timestampMs}-${i}`}
          cx={xAt(i)}
          cy={yAt(p.observedSpeedKmh)}
          r="2.4"
          fill="#D45815"
          opacity="0.55"
        />
      ))}

      {/* Kalman-filtered smoothed trajectory */}
      <polyline
        points={filteredLine}
        fill="none"
        stroke="#1553B7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <text x={padL} y={height - 2} fontSize="8" fill="#767E87">
        Older probes ({history.length} obs)
      </text>
      <text x={width - padR} y={height - 2} textAnchor="end" fontSize="8" fill="#767E87">
        Latest GPS
      </text>
    </svg>
  );
}
