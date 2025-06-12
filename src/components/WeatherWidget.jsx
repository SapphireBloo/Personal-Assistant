import React, { useState, useEffect } from "react";

function WeatherWidget() {
  const [weatherData, setWeatherData] = useState(null);
  const [locationName, setLocationName] = useState("Unknown location");
  const [error, setError] = useState(null);

  const cToF = (c) => (c * 9) / 5 + 32;

  useEffect(() => {
    let intervalId;
    let reverseTimeoutId;

    async function fetchWeather(lat, lon) {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation_probability`
        );
        const data = await res.json();
        if (data.current_weather) {
          setWeatherData(data);
        } else {
          setError("Weather data unavailable");
        }
      } catch {
        setError("Failed to fetch weather data");
      }
    }

    async function fetchLocationName(lat, lon) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
          {
            headers: {
              "User-Agent": "MyVoiceAssistantApp/1.0 (your-email@example.com)"
            }
          }
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

            // Debounce reverse geocoding to avoid timeout
            if (reverseTimeoutId) clearTimeout(reverseTimeoutId);
            reverseTimeoutId = setTimeout(() => {
              fetchLocationName(latitude, longitude);
            }, 1000);
          },
          () => setError("Location permission denied")
        );
      } else {
        setError("Geolocation not supported");
      }
    }

    updateWeather();
    intervalId = setInterval(updateWeather, 180000); // every 3 minutes

    return () => {
      clearInterval(intervalId);
      clearTimeout(reverseTimeoutId);
    };
  }, []);

  if (error) {
    return (
      <div style={widgetStyle}>
        {error}
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div style={widgetStyle}>
        Loading weather...
      </div>
    );
  }

  const current = weatherData.current_weather;
  const hourly = weatherData.hourly || {};

  function findClosestTimeIndex(currentTime, timeArray) {
    const currentDate = new Date(currentTime);
    const currentHour = new Date(currentDate.toISOString().slice(0, 13) + ":00:00");
    return timeArray?.findIndex((t) => t === currentHour.toISOString().slice(0, 13) + ":00");
  }

  const timeIndex = findClosestTimeIndex(current.time, hourly.time || []);
  const chanceOfRain = timeIndex !== -1 && hourly.precipitation_probability
    ? hourly.precipitation_probability[timeIndex]
    : "N/A";

  return (
    <div style={widgetStyle}>
      <h3 style={{ margin: "0 0 10px 0" }}>{locationName}</h3>
      <p><strong>Temp:</strong> {cToF(current.temperature).toFixed(1)}°F</p>
      <p><strong>Wind:</strong> {current.windspeed} km/h</p>
      <p><strong>Chance of Rain:</strong> {chanceOfRain}%</p>
    </div>
  );
}

const widgetStyle = {
  position: "fixed",
  top: 20,
  right: 20,
  padding: 16,
  backgroundColor: "rgba(0,0,0,0.6)",
  color: "#e0e0e0",
  borderRadius: 12,
  zIndex: 10,
  maxWidth: 260,
  fontSize: 14,
  fontFamily: "Arial, sans-serif",
  boxShadow: "0 0 15px rgba(15,82,186,0.7)",
};

export default WeatherWidget;
