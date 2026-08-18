# NoiseIQ – Urban Noise Analytics Platform

An end-to-end, production-grade municipal acoustic telemetry platform and crowdsourced noise mapping dashboard built with **React (Vite), Tailwind CSS, DaisyUI, Leaflet, FastAPI (Python)**, and a **PostgreSQL/PostGIS** database layer with client-side offline fallback.

---

## 🌟 Key Features

1. **UX & UI Design System**:
   - Built on DaisyUI's `emerald` & `corporate` themes paired with a dark municipal/GovTech header.
   - High data density statistical cards (`stat`), `table-zebra` telemetry stream, and interactive Leaflet map visuals.

2. **Real-time Web Audio API Microphone dB Sampler**:
   - Samples ambient audio directly from user microphone for 3 to 5 seconds.
   - Computes Root Mean Square (RMS) amplitude and converts it to estimated sound pressure level (dB SPL).
   - Live animated volume visualizer meter bar.

3. **Geospatial & GPS Geolocation**:
   - `navigator.geolocation` auto-detection with map pin locking.
   - Interactive Leaflet map with custom color-coded circle markers for severity:
     - **Green (< 55 dB)**: Quiet / Safe
     - **Yellow (55–70 dB)**: Moderate
     - **Red (> 70 dB)**: Critical / Acoustic Violation (pulsing border animation)

4. **Analytics & Time-Series Dashboard**:
   - DaisyUI Stat widgets: City Avg dB, Active Telemetry Sensors, Violations Today, Peak Noise Zone.
   - Recharts 24-hour decibel fluctuation trend charts and category breakdown.

5. **FastAPI & PostGIS Backend Architecture**:
   - Asynchronous FastAPI application with CORS middleware and Pydantic validation.
   - GeoJSON spatial feature endpoints (`/api/v1/noise/live`), aggregate stats (`/api/v1/analytics/stats`), 24h trends (`/api/v1/analytics/trends`), and submission ingestion (`/api/v1/noise/submit`).
   - SQLite/JSON fallback engine ensuring 100% standalone operation even without active PostgreSQL servers.

---

## 🚀 Quick Start Guide

### 1. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

### 2. Backend Setup (FastAPI + Python)

```bash
cd backend
pip install -r requirements.txt
python seed.py
python main.py
```
Backend API will be running at `http://localhost:8000`. Interactive OpenAPI docs available at `http://localhost:8000/docs`.

---

## 📁 Repository Structure

```
NoiseIQ/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # GovTech header & view controls
│   │   │   ├── MapView.jsx          # Leaflet map & color-coded markers
│   │   │   ├── AnalyticsPanel.jsx   # DaisyUI stats & Recharts trends
│   │   │   ├── NoiseFeedTable.jsx   # Raw telemetry log stream
│   │   │   ├── FilterBar.jsx        # Category & dB threshold filters
│   │   │   └── SubmitNoiseModal.jsx # Mic sampler & GPS submission modal
│   │   ├── services/
│   │   │   ├── audioSampler.js      # Web Audio API RMS calculation & dB SPL
│   │   │   ├── api.js               # Backend client with mock fallback
│   │   │   └── mockData.js          # Seeded metropolitan dataset
│   │   ├── App.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   └── package.json
└── backend/
    ├── main.py                      # FastAPI REST application
    ├── database.py                  # SQLAlchemy PostGIS / SQLite engine
    ├── models.py                    # NoiseReading database model
    ├── schemas.py                   # Pydantic data validation schemas
    ├── crud.py                      # Spatial queries & aggregate stats
    ├── seed.py                      # Telemetry seed data generator
    └── requirements.txt
```
