import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Calendar as CalendarIcon, MapPin, Search } from "lucide-react";
import { format, isToday } from "date-fns";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

const API_BASE = "http://127.0.0.1:8000";

// 🕒 Live Clock Component (24h format only)
function Clock24h() {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-4 right-6 text-right bg-white/80 backdrop-blur-sm shadow-md rounded-lg px-4 py-2 border border-gray-200">
      <p className="text-2xl font-bold text-gray-900 tracking-wider">
        {format(clock, "HH:mm:ss")}
      </p>
      <p className="text-sm text-gray-600 font-medium">
        {format(clock, "dd MMM yyyy")}
      </p>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [lat, setLat] = useState(12.9716);
  const [lon, setLon] = useState(77.5946);
  const [city, setCity] = useState("Bangalore");
  const [searchCity, setSearchCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const fetchData = async (latitude = lat, longitude = lon, cityName = city) => {
    try {
      const r = await fetch(
        `${API_BASE}/api/live?lat=${latitude}&lon=${longitude}&city=${cityName}`
      );
      if (!r.ok) throw new Error("Failed to fetch");
      const j = await r.json();
      setData(j);
      setCity(cityName);
      setLat(latitude);
      setLon(longitude);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      alert("Error fetching data. Check backend is running.");
    }
  };

  // 🔎 Fetch city suggestions (only India)
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=5&language=en&country=IN`
      );
      const json = await res.json();

      if (json.results) {
        const indianResults = json.results.filter(
          (loc) => loc.country_code === "IN"
        );
        setSuggestions(indianResults);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("❌ Suggestion fetch error:", err);
    }
  };

  // ✅ Handle suggestion selection
  const handleSelectSuggestion = (loc) => {
    setSearchCity(`${loc.name}, ${loc.admin1 || ""}`);
    setSuggestions([]);
    fetchData(loc.latitude, loc.longitude, loc.name);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <p className="p-6 text-lg">Loading data...</p>;

  const forecast = data.forecast_30d || [];

  const getAQIColor = (aqi, variant = "text") => {
    if (aqi > 150) return variant === "text" ? "text-red-600" : "bg-red-500";
    if (aqi > 80) return variant === "text" ? "text-orange-500" : "bg-orange-400";
    return variant === "text" ? "text-green-600" : "bg-green-500";
  };

  const selectedForecast = forecast.find(
    (f) => f.date === format(date, "yyyy-MM-dd")
  );

  return (
    <div className="relative p-6 font-sans bg-gradient-to-br from-blue-50 to-green-50 min-h-screen text-gray-900">
      {/* 🕒 Live Clock */}
      <Clock24h />

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 flex items-center gap-2 text-blue-800"
      >
        🌍 AQI & Weather Dashboard
      </motion.h1>

      {/* Search by City (Autocomplete) */}
      <div className="relative mb-6 w-80">
        <div className="flex">
          <input
            type="text"
            value={searchCity}
            onChange={(e) => {
              setSearchCity(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            className="flex-grow px-4 py-2 rounded-l-lg text-black border shadow"
            placeholder="Enter Indian city (e.g., Chennai)"
          />
          <button
            onClick={() =>
              suggestions.length > 0
                ? handleSelectSuggestion(suggestions[0])
                : fetchSuggestions(searchCity)
            }
            className="px-4 bg-indigo-500 text-white rounded-r-lg hover:bg-indigo-600 transition flex items-center"
          >
            <Search size={18} />
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 bg-white border rounded-lg shadow mt-1 z-10 max-h-48 overflow-y-auto">
            {suggestions.map((loc) => (
              <li
                key={loc.id}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelectSuggestion(loc)}
              >
                {loc.name}, {loc.admin1 || ""} (
                {loc.latitude.toFixed(2)},{loc.longitude.toFixed(2)})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lat/Lon Input */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="number"
          step="0.01"
          value={lat}
          onChange={(e) => setLat(parseFloat(e.target.value))}
          className="px-4 py-2 rounded-lg text-black border shadow"
          placeholder="Latitude"
        />
        <input
          type="number"
          step="0.01"
          value={lon}
          onChange={(e) => setLon(parseFloat(e.target.value))}
          className="px-4 py-2 rounded-lg text-black border shadow"
          placeholder="Longitude"
        />
        <button
          onClick={() => fetchData(lat, lon, "Custom Location")}
          className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
        >
          Search by Lat/Lon
        </button>
      </div>

      {/* Weather summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 border rounded-lg shadow bg-white"
      >
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-blue-700">
          <MapPin size={18} /> Weather Now ({city})
        </h2>
        <div className="grid grid-cols-2 gap-4 text-gray-700">
          <p>
            🌡 Temp: <span className="font-semibold">{data.weather.temp_c} °C</span>
          </p>
          <p>
            💧 Humidity: <span className="font-semibold">{data.weather.humidity} %</span>
          </p>
          <p>
            🌬 Wind: <span className="font-semibold">{data.weather.wind_speed} m/s</span>
          </p>
          <p>
            ⏱ Pressure: <span className="font-semibold">{data.weather.pressure} hPa</span>
          </p>
        </div>
      </motion.div>

      {/* Current AQI Components */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 border rounded-lg shadow bg-white"
      >
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          🧪 Current AQI Components
        </h2>
        <div className="grid grid-cols-2 gap-2 text-gray-700">
          <p>PM2.5: {data.current_components.PM25}</p>
          <p>PM10: {data.current_components.PM10}</p>
          <p>NO2: {data.current_components.NO2}</p>
          <p>SO2: {data.current_components.SO2}</p>
          <p>O3: {data.current_components.O3}</p>
          <p>CO: {data.current_components.CO}</p>

        </div>
      </motion.div>

      {/* Calendar toggle */}
      <button
        className="mb-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <CalendarIcon size={20} /> Pick a Date
      </button>

      {showCalendar && (
        <div className="mb-6">
          <Calendar
            onChange={(d) => {
              setDate(d);
              setShowCalendar(false);
            }}
            value={date}
            tileClassName={({ date }) => {
              const f = forecast.find(
                (x) => x.date === format(date, "yyyy-MM-dd")
              );
              if (!f) return "";
              return getAQIColor(f.predicted_aqi, "bg");
            }}
          />
        </div>
      )}

      {/* Selected date AQI info */}
      <div className="p-4 border rounded-lg shadow bg-white mb-6">
        <h2 className="text-xl font-semibold mb-2">
          AQI for {isToday(date) ? "Today" : format(date, "PPP")}
        </h2>
        {isToday(date) ? (
          <div className="text-lg space-y-2">
            <p className="font-semibold">📊 Next 3-Hour AQI Forecast:</p>
            {(() => {
              const now = new Date();
              const currentHour = now.getHours();
              const next3 = data.hourly_aqi
                .filter((h) => {
                  const hr = new Date(h.time).getHours();
                  return hr > currentHour && hr <= currentHour + 3;
                })
                .slice(0, 3);

              const getCondition = (aqi) => {
                if (aqi > 150) return { label: "Unhealthy", color: "bg-red-500" };
                if (aqi > 80) return { label: "Moderate", color: "bg-orange-400" };
                return { label: "Good", color: "bg-green-500" };
              };

              return next3.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {next3.map((h, idx) => {
                    const hr = new Date(h.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const condition = getCondition(h.predicted_aqi);
                    return (
                      <li key={idx} className="flex items-center gap-2">
                        {hr}:{" "}
                        <span
                          className={`font-bold ${getAQIColor(
                            h.predicted_aqi,
                            "text"
                          )}`}
                        >
                          {h.predicted_aqi.toFixed(0)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium text-white ${condition.color}`}
                        >
                          {condition.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>No forecast available for the next 3 hours.</p>
              );
            })()}
          </div>
        ) : (
          <p className="text-lg">
            📊 Predicted AQI:{" "}
            <span
              className={`font-bold ${getAQIColor(
                selectedForecast?.predicted_aqi || 0,
                "text"
              )}`}
            >
              {selectedForecast?.predicted_aqi
                ? selectedForecast.predicted_aqi.toFixed(0)
                : "N/A"}
            </span>
          </p>
        )}
      </div>

      {/* Hourly AQI */}
      {isToday(date) && data.hourly_aqi && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 border rounded-lg shadow bg-white"
        >
          <h2 className="text-xl font-semibold mb-2">⏰ Hourly AQI (Today)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.hourly_aqi}>
              <Line
                type="monotone"
                dataKey="predicted_aqi"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <CartesianGrid stroke="#ccc" />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => t.split("T")[1].slice(0, 5)}
              />
              <YAxis />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const aqi = payload[0].value.toFixed(2);
                    return (
                      <div className="bg-white border border-gray-300 shadow-md rounded-lg px-3 py-2 text-sm">
                        <p className="font-semibold text-gray-800">
                          ⏰ Time: {label.split("T")[1].slice(0, 5)}
                        </p>
                        <p className="text-emerald-600 font-bold">
                          AQI Forecast: {aqi}
                        </p>
                        <p className="text-gray-500">
                          Condition:{" "}
                          {aqi > 150 ? "Unhealthy" : aqi > 80 ? "Moderate" : "Good"}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* 30-day Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 border rounded-lg shadow bg-white"
      >
        <h2 className="text-xl font-semibold mb-2">📈 30-Day AQI Forecast</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecast}>
            <Line
              type="monotone"
              dataKey="predicted_aqi"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const aqi = payload[0].value.toFixed(2);
                  return (
                    <div className="bg-white border border-gray-300 shadow-md rounded-lg px-3 py-2 text-sm">
                      <p className="font-semibold text-gray-800">
                        📅 Date: {label}
                      </p>
                      <p className="text-blue-600 font-bold">
                        AQI Forecast: {aqi}
                      </p>
                      <p className="text-gray-500">
                        Condition:{" "}
                        {aqi > 150 ? "Unhealthy" : aqi > 80 ? "Moderate" : "Good"}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
