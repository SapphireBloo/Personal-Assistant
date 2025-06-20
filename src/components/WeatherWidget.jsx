import React, { useState, useEffect } from "react";


function WeatherWidget() {
  const [weatherData, setWeatherData] = useState(null);
  const [locationName, setLocationName] = useState("Unknown location");
  const [error, setError] = useState(null);
  const [windUnit, setWindUnit] = useState("km/h");
  const [tempUnit, setTempUnit] = useState("°F");

  const convertTemp = (celsius) =>
    tempUnit === "°F" ? ((celsius * 9) / 5 + 32).toFixed(1) : celsius.toFixed(1);

  const convertWindSpeed = (speedKmh) => {
    switch (windUnit) {
      case "mph":
        return (speedKmh * 0.621371).toFixed(1);
      case "knots":
        return (speedKmh * 0.539957).toFixed(1);
      default:
        return speedKmh.toFixed(1);
    }
  };

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
              "User-Agent": "MyVoiceAssistantApp/1.0 (your-email@example.com)",
            },
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
    intervalId = setInterval(updateWeather, 180000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(reverseTimeoutId);
    };
  }, []);

  if (error) return <div style={widgetStyle}>{error}</div>;
  if (!weatherData) return <div style={widgetStyle}>Loading weather...</div>;

  const current = weatherData.current_weather;
  const hourly = weatherData.hourly || {};

  function findClosestTimeIndex(currentTime, timeArray) {
    const currentDate = new Date(currentTime);
    const currentHour = new Date(
      currentDate.toISOString().slice(0, 13) + ":00:00"
    );
    return timeArray?.findIndex(
      (t) => t === currentHour.toISOString().slice(0, 13) + ":00"
    );
  }

  const timeIndex = findClosestTimeIndex(current.time, hourly.time || []);
  const chanceOfRain =
    timeIndex !== -1 && hourly.precipitation_probability
      ? hourly.precipitation_probability[timeIndex]
      : "N/A";

  return (
    <div style={widgetStyle}>
      <h3 style={{ margin: "0 0 10px 0" }}>{locationName}</h3>
      <p>
        <strong>Temp:</strong> {convertTemp(current.temperature)}
        <select
          value={tempUnit}
          onChange={(e) => setTempUnit(e.target.value)}
          style={selectStyle}
          aria-label="Select temperature unit"
        >
          <option value="°F">°F</option>
          <option value="°C">°C</option>
        </select>
      </p>
      <p>
        <strong>Wind:</strong> {convertWindSpeed(current.windspeed)}
        <select
          value={windUnit}
          onChange={(e) => setWindUnit(e.target.value)}
          style={selectStyle}
          aria-label="Select wind speed unit"
        >
          <option value="km/h">km/h</option>
          <option value="mph">mph</option>
          <option value="knots">knots</option>
        </select>
      </p>
      <p>
        <strong>Chance of Rain:</strong> {chanceOfRain}%
      </p>
    </div>
  );
}

const widgetStyle = {
  padding: 16,
  backgroundColor: "rgba(0,0,0,0.6)",
  color: "#e0e0e0",
  borderRadius: 12,
  maxWidth: 260,
  fontSize: 14,
  fontFamily: "Arial, sans-serif",
  boxShadow: "0 0 15px rgba(15,82,186,0.7)",
};


const selectStyle = {
  backgroundColor: "rgba(0,0,0,0.6)",
  color: "#e0e0e0",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "2px 24px 2px 6px",
  fontSize: "inherit",
  fontWeight: "bold",
  marginLeft: 4,
  appearance: "auto",
  cursor: "pointer",
};

export default WeatherWidget;
