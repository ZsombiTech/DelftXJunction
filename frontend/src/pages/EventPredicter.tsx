/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Cloud,
} from "lucide-react";
import { useFetchEventsMutation } from "../redux/api/statsApi";
import LoadingScreen from "../components/LoadingScreen";

const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

const DemandPredictor: React.FC = () => {
  const [weather, setWeather] = useState<any>(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("Rotterdam, Netherlands");

  const [fetchEvents] = useFetchEventsMutation();

  useEffect(() => {
    const fetchData = async (lat: number, lon: number) => {
      setLoading(true);
      try {
        const weatherRes = await axios.get(WEATHER_API_URL, {
          params: {
            latitude: lat,
            longitude: lon,
            current_weather: true,
            temperature_unit: "fahrenheit",
          },
        });
        setWeather(weatherRes.data.current_weather);

        const eventsRes = await fetchEvents({
          latitude: lat,
          longitude: lon,
        });
        setEvents(
          eventsRes.data.events
            ? (eventsRes.data.events.events_results ?? [])
            : []
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(
            `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`
          );
          fetchData(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to default location
          fetchData(51.9225, 4.47917); // Rotterdam coordinates
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      fetchData(51.9225, 4.47917); // Rotterdam coordinates
    }
  }, [location]);

  const determineDemand = () => {
    if (!weather) return "Moderate";

    let demandScore = 0;

    // Rule 1: Bad Weather = Higher Demand
    if (
      weather.weathercode === 3 ||
      weather.weathercode === 4 ||
      weather.weathercode === 5
    ) {
      demandScore += 2;
    } else if (weather.temperature < 40 || weather.temperature > 90) {
      demandScore += 1;
    }

    // Rule 2: Nearby Events = Higher Demand
    if (events.length > 5) {
      demandScore += 2;
    } else if (events.length > 0) {
      const majorEvents = events.filter(
        (e: any) =>
          e.title.toLowerCase().includes("concert") ||
          e.title.toLowerCase().includes("game")
      );
      if (majorEvents.length > 0) {
        demandScore += 3;
      } else if (events.length > 0) {
        demandScore += 1;
      }
    }

    if (demandScore >= 3) return "High";
    if (demandScore >= 1) return "Moderate";
    return "Low";
  };

  const demandLevel = determineDemand();

  const getDemandStyle = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-600 text-white shadow-red-800/50";
      case "Moderate":
        return "bg-yellow-500 text-uber-dark-grey shadow-yellow-800/50";
      case "Low":
      default:
        return "bg-uber-green text-white shadow-uber-green/50";
    }
  };

  const getDemandIcon = (level: string) => {
    switch (level) {
      case "High":
        return <ArrowUpCircle className="w-8 h-8 mr-3 animate-pulse" />;
      case "Moderate":
        return <AlertTriangle className="w-8 h-8 mr-3" />;
      case "Low":
      default:
        return <ArrowDownCircle className="w-8 h-8 mr-3" />;
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-uber-light-grey p-4 sm:p-8 font-sans">
      <header className="mb-8 p-4 bg-white shadow-md rounded-xl md:p-6">
        <h1 className="text-3xl font-bold text-uber-black">
          Opportunities nearby
        </h1>
        <p className="mt-2 text-uber-gray-500">
          Based on current weather and local events in {location}
        </p>
      </header>

      <main className="mx-auto space-y-8">
        <div
          className={`p-6 rounded-xl shadow-lg flex flex-col items-center text-center ${getDemandStyle(
            demandLevel
          )}`}
        >
          <div className="flex items-center justify-center mb-3">
            {getDemandIcon(demandLevel)}
            <p className="text-4xl font-bold uppercase tracking-wider">
              {demandLevel} Demand
            </p>
          </div>
          <p className="text-lg font-medium">
            {demandLevel === "High" &&
              "Expect surge pricing and high rider volume."}
            {demandLevel === "Moderate" &&
              "Steady business expected with some peak hours."}
            {demandLevel === "Low" &&
              "Demand is currently low. Wait for events to start or weather to change."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl shadow-lg bg-white border-l-4 border-uber-green">
            <h2 className="text-2xl font-bold text-uber-black border-b border-uber-light-grey pb-2 mb-4">
              Current Weather <Cloud className="inline-block ml-2" />
            </h2>
            {weather && (
              <div className="space-y-2 text-uber-dark-grey">
                <p className="text-4xl font-light">{weather.temperature}°F</p>
                <p className="text-xl font-semibold">
                  Conditions: {weather.weathercode}
                </p>
                <p>Windspeed: {weather.windspeed} mph</p>
                <p className="text-sm italic pt-2">
                  <span className="font-bold">Demand Impact:</span>
                  {weather.weathercode !== 1
                    ? " Increased (People prefer indoor transport)"
                    : " Normal"}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-xl shadow-lg bg-white border-l-4 border-uber-green">
            <h2 className="text-2xl font-bold text-uber-black border-b border-uber-light-grey pb-2 mb-4">
              Nearby Events <Calendar className="inline-block ml-2" />
            </h2>
            {events.length > 0 ? (
              <ul className="space-y-3">
                {events
                  .filter(
                    (event: any, index: number, self: any) =>
                      index ===
                      self.findIndex((e: any) => e.title === event.title)
                  )
                  .slice(0, 5)
                  .map((event: any, index: number) => (
                    <li
                      key={index}
                      className="cursor-pointer p-3 bg-uber-grey-500 rounded-lg shadow-sm border-l-2 border-green-200"
                      onClick={() => window.open(event.link, "_blank")}
                    >
                      <p className="font-semibold text-uber-dark-grey">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500">{event.date.when}</p>
                      <p className="text-sm text-gray-500">{event.date.when}</p>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">
                No major events detected in the immediate area.
              </p>
            )}
          </div>
        </div>

        <div className="text-xs text-center text-gray-500 pt-4">
          *Prediction is based on a simplified correlation model. Real-time
          demand may vary.
        </div>
      </main>
    </div>
  );
};

export default DemandPredictor;
