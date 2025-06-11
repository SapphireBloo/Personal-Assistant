import React, { useState, useEffect } from "react";

function WeatherWidget() {
  const [weatherData, setWeatherData] = useState(null);
  const [locationName, setLocationName] = useState("Unknown location");
  const [error, setError] = useState(null);

  // Helper: Convert Celsius to Fahrenheit
  const cToF = (c) => (c * 9) / 5 + 32;

  useEffect(() => {
    let intervalId;

    async function fetchWeather(lat, lon) {
      try {
        // Fetch weather data including precipitation_probability
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation_probability`
        );
        const data = await res.json();

        if (data.current_weather) {
          setWeatherData(data);
        } else {
          setError("Weather data unavailable");
        }
      } catch (e) {
        setError("Failed to fetch weather data");
      }
    }

    async function fetchLocationName(lat, lon) {
      try {
        // Reverse geocode with OpenStreetMap Nominatim
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        setLocationName(
          data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.county ||
            "Unknown location"
        );
      } catch {
        setLocationName("Unknown location");
      }
    }

    function updateWeather() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            fetchWeather(latitude, longitude);
            fetchLocationName(latitude, longitude);
          },
          () => setError("Location permission denied")
        );
      } else {
        setError("Geolocation not supported");
      }
    }

    updateWeather();

    // Refresh every 3 minutes
    intervalId = setInterval(updateWeather, 180000);

    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return (
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          padding: 10,
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "#eee",
          borderRadius: 8,
          zIndex: 10,
          fontSize: 14,
          maxWidth: 260,
        }}
      >
        {error}
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          padding: 10,
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "#eee",
          borderRadius: 8,
          zIndex: 10,
          fontSize: 14,
          maxWidth: 260,
        }}
      >
        Loading weather...
      </div>
    );
  }

  const current = weatherData.current_weather;
  const hourly = weatherData.hourly || {};
  // Find nearest hour in hourly.time to current time
function findClosestTimeIndex(currentTime, timeArray) {
  const currentDate = new Date(currentTime);
  const currentHour = new Date(currentDate.toISOString().slice(0, 13) + ":00:00");
  return timeArray?.findIndex((t) => t === currentHour.toISOString().slice(0, 13) + ":00");
}

const timeIndex = findClosestTimeIndex(current.time, hourly.time || []);
const chanceOfRain =
  timeIndex !== -1 && hourly.precipitation_probability
    ? hourly.precipitation_probability[timeIndex]
    : "N/A";


  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: 16,
        borderRadius: 12,
        color: "#e0e0e0",
        fontFamily: "Arial, sans-serif",
        zIndex: 10,
        maxWidth: 260,
        boxShadow: "0 0 15px rgba(15,82,186,0.7)",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0" }}>{locationName}</h3>
      <p style={{ margin: "4px 0" }}>
        <strong>Temp:</strong> {cToF(current.temperature).toFixed(1)}°F
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Wind:</strong> {current.windspeed} km/h
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Chance of Rain:</strong> {chanceOfRain}%
      </p>
    </div>
  );
}

export default WeatherWidget;
