import requests
import datetime as dt
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model_loader import load_model

SESSION = requests.Session()
app = FastAPI(title="AQI & Weather Predictor (Open-Meteo)", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- MODELS -----------------
class AQIFeatures(BaseModel):
    PM25: float
    PM10: float
    NO2: float
    NO: float = 0.0
    NH3: float
    CO: float
    SO2: float
    O3: float


def _safe_num(x, default=0.0):
    """Convert None or invalid to float(default)."""
    try:
        if x is None:
            return default
        return float(x)
    except Exception:
        return default


# ----------------- FETCH HELPERS -----------------
def fetch_air_quality(lat: float, lon: float):
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join([
            "pm10",
            "pm2_5",
            "carbon_monoxide",
            "nitrogen_dioxide",
            "sulphur_dioxide",
            "ozone",
            "ammonia",
        ]),
    }
    print("🌍 Air Quality API URL:", requests.Request("GET", url, params=params).prepare().url)
    r = SESSION.get(url, params=params, timeout=20)
    r.raise_for_status()
    return r.json()


def fetch_weather(lat: float, lon: float):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m",
    }
    print("🌦️ Weather API URL:", requests.Request("GET", url, params=params).prepare().url)
    r = SESSION.get(url, params=params, timeout=20)
    r.raise_for_status()
    return r.json()


def predict_3h(features: AQIFeatures):
    model = load_model()
    X = [[
        features.PM25,
        features.PM10,
        features.NO2,
        features.NO,
        features.NH3,
        features.CO,
        features.SO2,
        features.O3,
    ]]
    return float(model.predict(X)[0])


# ----------------- API ROUTE -----------------
@app.get("/api/live")
def live(lat: float = Query(...), lon: float = Query(...), city: Optional[str] = None):
    try:
        aq = fetch_air_quality(lat, lon)
        wx = fetch_weather(lat, lon)

        comps = AQIFeatures(
            PM25=_safe_num(aq["hourly"]["pm2_5"][0]),
            PM10=_safe_num(aq["hourly"]["pm10"][0]),
            NO2=_safe_num(aq["hourly"]["nitrogen_dioxide"][0]),
            NO=0.0,
            NH3=_safe_num(aq["hourly"]["ammonia"][0]),
            CO=_safe_num(aq["hourly"]["carbon_monoxide"][0]),
            SO2=_safe_num(aq["hourly"]["sulphur_dioxide"][0]),
            O3=_safe_num(aq["hourly"]["ozone"][0]),
        )

        weather = {
            "temp_c": _safe_num(wx["current"]["temperature_2m"]),
            "humidity": _safe_num(wx["current"]["relative_humidity_2m"]),
            "pressure": _safe_num(wx["current"]["pressure_msl"]),
            "wind_speed": _safe_num(wx["current"]["wind_speed_10m"]),
        }

        aqi3 = predict_3h(comps)

        # ----------------- FIXED 30-DAY FORECAST -----------------
        forecast30 = []
        try:
            hours = aq.get("hourly", {})
            timestamps = hours.get("time", [])
            pm25_vals = hours.get("pm2_5", [])
            pm10_vals = hours.get("pm10", [])
            no2_vals = hours.get("nitrogen_dioxide", [])
            co_vals = hours.get("carbon_monoxide", [])
            so2_vals = hours.get("sulphur_dioxide", [])
            o3_vals = hours.get("ozone", [])
            nh3_vals = hours.get("ammonia", [])

            today = dt.date.today()
            for d in range(30):
                i = min(d, len(timestamps) - 1)  # pick one index per day
                features = AQIFeatures(
                    PM25=_safe_num(pm25_vals[i] if i < len(pm25_vals) else None),
                    PM10=_safe_num(pm10_vals[i] if i < len(pm10_vals) else None),
                    NO2=_safe_num(no2_vals[i] if i < len(no2_vals) else None),
                    NO=0.0,
                    NH3=_safe_num(nh3_vals[i] if i < len(nh3_vals) else None),
                    CO=_safe_num(co_vals[i] if i < len(co_vals) else None),
                    SO2=_safe_num(so2_vals[i] if i < len(so2_vals) else None),
                    O3=_safe_num(o3_vals[i] if i < len(o3_vals) else None),
                )
                try:
                    predicted = predict_3h(features)
                except Exception:
                    predicted = 50.0

                forecast30.append({
                    "date": (today + dt.timedelta(days=d + 1)).isoformat(),
                    "predicted_aqi": max(0.0, predicted),
                })
        except Exception as e:
            print("⚠️ Failed to build 30-day AQI forecast:", e)
        # ----------------------------------------------------------

        # Hourly AQI for today
        hourly_aqi = []
        try:
            hours = aq.get("hourly", {})
            timestamps = hours.get("time", [])
            pm25_vals = hours.get("pm2_5", [])
            pm10_vals = hours.get("pm10", [])
            no2_vals = hours.get("nitrogen_dioxide", [])
            co_vals = hours.get("carbon_monoxide", [])
            so2_vals = hours.get("sulphur_dioxide", [])
            o3_vals = hours.get("ozone", [])
            nh3_vals = hours.get("ammonia", [])

            for i, ts in enumerate(timestamps[:24]):  # today = first 24 hours
                features = AQIFeatures(
                    PM25=_safe_num(pm25_vals[i] if i < len(pm25_vals) else None),
                    PM10=_safe_num(pm10_vals[i] if i < len(pm10_vals) else None),
                    NO2=_safe_num(no2_vals[i] if i < len(no2_vals) else None),
                    NO=0.0,
                    NH3=_safe_num(nh3_vals[i] if i < len(nh3_vals) else None),
                    CO=_safe_num(co_vals[i] if i < len(co_vals) else None),
                    SO2=_safe_num(so2_vals[i] if i < len(so2_vals) else None),
                    O3=_safe_num(o3_vals[i] if i < len(o3_vals) else None),
                )
                try:
                    predicted = predict_3h(features)
                except Exception:
                    predicted = 50.0
                hourly_aqi.append({"time": ts, "predicted_aqi": predicted})
        except Exception as e:
            print("⚠️ Failed to build hourly AQI:", e)

        return {
            "city": city or "Unknown",
            "lat": lat,
            "lon": lon,
            "fetched_at": dt.datetime.utcnow().isoformat(),
            "weather": weather,
            "current_components": comps.model_dump(),
            "predicted_aqi_3h": aqi3,
            "forecast_30d": forecast30,
            "hourly_aqi": hourly_aqi,
        }

    except Exception as e:
        print("🔥 Unexpected error in /api/live:", e)
        raise HTTPException(status_code=500, detail=str(e))


# ----------------- MODEL LOADER -----------------
import joblib
import os

_model_cache = None

def load_model(model_path: str = "/Users/nitheeswaran/aqi-weather-app/aqi_2020_multivariate_model.pkl"):
    global _model_cache
    if _model_cache is not None:
        return _model_cache
    try:
        _model_cache = joblib.load(model_path)
    except Exception as e:
        # Fallback dummy model
        class DummyModel:
            def predict(self, X):
                import numpy as np
                return np.sum(X, axis=1) * 0.1 + 50
        _model_cache = DummyModel()
        print(f"[WARN] Could not load model at {model_path}, using DummyModel. Error: {e}")
    return _model_cache
