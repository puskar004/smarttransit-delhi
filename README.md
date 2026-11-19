# SmartTransit AI — Crowdedness-Aware Journey Planner & Real-Time Traffic Model

> **Delhi Transport Stack · Real-Time Transit Intelligence Platform**  
> AI-Powered Public Transport Journey Planner fusing **Bus GPS Locations**, **ETM Passenger Ticketing Logs**, and **Road Congestion Dynamics** for Delhi's DTC & DIMTS Network.

---

## 🎯 What SmartTransit AI Solves

Existing journey planners only optimize for theoretical travel time using static timetables, ignoring two major Delhi commute realities:
1. **Severe Passenger Crowding:** A bus that arrives in 10 minutes might be so packed (95% crush load) that boarding is difficult or standing is exhausting.
2. **Dynamic Road Jams:** Peak bottlenecks at Ashram Chowk, Chirag Delhi, or ITO Bridge cause unpredicted delays that make timetable estimates useless.

**SmartTransit AI** solves both by answering the commuter's real dilemma:
> *"Should I take the crowded bus right now, or wait 4 minutes for an air-conditioned bus with an 85% guaranteed seat that arrives only 5 minutes later?"*

---

## ⚡ Core Features

- **⚡ AI Smart Recommender:**
  Auto-ranks journeys using a multi-objective utility function evaluating travel time, passenger occupancy %, seat probability, reliability, and AC availability. Displays a featured **"Top Pick For You · Match %"** with natural-language AI reasoning.
- **👥 ETM-Driven Crowdedness Model:**
  Estimates passenger loads (**Low Crowd**, **Moderate**, **Crush Load**) and seat probability % using historical Electronic Ticketing Machine (ETM) boarding rates, bus capacity thresholds (60–70 pax), and schedule bunching penalties.
- **🚦 1D Kalman Filter Bus Traffic Model:**
  Turns 72 live Delhi bus GPS probes into real-time directed road segment speeds with 24-hour diurnal patterns, dwell-time separation, and upstream queue spillback propagation.
- **🎨 Modern SmartLearn / CurioSphere UI/UX:**
  Designed with clean white and violet/indigo palettes, ambient glow effects, pastel service docks, and interactive persona selectors.
- **🎫 Digital Transit Pass & QR:**
  Simulated Delhi Digital Transit Pass with ETM QR scanning, live wallet balance, and commuter transit statistics.
- **🚌 All Available Buses & 1-Click Live Tracking:**
  Browse 72 active Delhi buses, check punctuality (`🟢 On Time`, `🔴 Delayed Xm`), crowd occupancy %, and lock the live Leaflet map camera onto any bus with floating telemetry HUD.
- **🗺️ Esri Dark Gray Canvas Basemap:**
  Zero watermark, high-contrast dark cartography displaying illuminated transit corridors, moving bus markers, and snaped stop sequences.
- **📡 Key Hub Crowding Radar:**
  Monitors live crowding at major Delhi interchange terminals (Nehru Place, AIIMS, Kashmere Gate, Okhla Phase-III, Anand Vihar).
- **🧪 1-Click Interactive Jam Simulator:**
  Simulate real bottlenecks (Ashram Chowk, Chirag Delhi Flyover, ITO Bridge) to observe live bus slowdowns, GPS detection, and instant AI commuter rerouting.
- **🔌 Pluggable Delhi OTD / GTFS-RT Adapter:**
  Runs out-of-the-box on a 72-bus Delhi simulator, plus 1-click external CSV/JSON upload and GeoJSON API export.

---

## 🚀 Quick Start

```bash
git clone <repo-url>
cd pravaah-delhi
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

---

## 🧪 Testing & Verification

Run the comprehensive unit test suite:

```bash
npm test
```

Build production bundle:

```bash
npm run build
```

---

## 📜 License

MIT License. Designed for the Delhi Transport Stack and Sustainable City Mobility.
