/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import MapGL, { Source, Layer } from "react-map-gl/mapbox";
import { heatmapLayer } from "./GeocoderControl";
import MapControlPanel from "./MapControlPanel";

function filterFeaturesByDay(featureCollection: any, time: number) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const features = featureCollection.features.filter((feature: any) => {
    const featureDate = new Date(feature.properties.time);
    return (
      featureDate.getFullYear() === year &&
      featureDate.getMonth() === month &&
      featureDate.getDate() === day
    );
  });
  return { type: "FeatureCollection", features };
}

export default function MapViewer() {
  const [allDays, useAllDays] = useState(true);
  const [timeRange, setTimeRange] = useState([0, 0]);
  const [selectedTime, selectTime] = useState(0);
  const [earthquakes, setEarthQuakes] = useState(null);
  const [merchants, setMerchants] = useState<any | null>(null);

  useEffect(() => {
    /* global fetch */
    fetch("https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson")
      .then((resp) => resp.json())
      .then((json) => {
        // Note: In a real application you would do a validation of JSON data before doing anything with it,
        // but for demonstration purposes we ingore this part here and just trying to select needed data...
        const features = json.features;
        const endTime = features[0].properties.time;
        const startTime = features[features.length - 1].properties.time;

        setTimeRange([startTime, endTime]);
        setEarthQuakes(json);
        selectTime(endTime);
      })
      .catch((err) => console.error("Could not load data", err)); // eslint-disable-line
  }, []);

  useEffect(() => {
    const base = import.meta.env.VITE_APP_BACKEND_URL ?? "";
    const url = `${base}/merchants/getAllMerchants`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => {
        // Accept several payload shapes:
        // - GeoJSON FeatureCollection
        // - Array of merchant objects
        // - { merchants: [...] } or { data: [...] } or { results: [...] }
        if (json && json.type === "FeatureCollection") {
          setMerchants(json);
          return;
        }

        const maybeArray =
          Array.isArray(json) ? json :
          (json && Array.isArray((json as any).merchants) && (json as any).merchants) ||
          (json && Array.isArray((json as any).data) && (json as any).data) ||
          (json && Array.isArray((json as any).results) && (json as any).results) ||
          null;

        if (maybeArray) {
          const features = maybeArray
            .map((m: any) => {
              // backend may return { longitude, latitude } or { lon, lat }
              const lon = m.longitude ?? m.lon ?? m.long ?? null;
              const lat = m.latitude ?? m.lat ?? null;
              if (lon == null || lat == null) return null;
              return {
                type: "Feature",
                properties: {
                  id: m.id ?? m._id ?? null,
                  name: m.name ?? m.label ?? null,
                },
                geometry: {
                  type: "Point",
                  coordinates: [Number(lon), Number(lat)],
                },
              };
            })
            .filter(Boolean);

          setMerchants({ type: "FeatureCollection", features });
          return;
        }

        // If we couldn't understand the payload, log it for debugging and set an empty collection
        // eslint-disable-next-line no-console
        console.error("Unexpected merchants payload", json);
        setMerchants({ type: "FeatureCollection", features: [] });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Could not load merchants", err);
      });
  }, []);

  const data = useMemo(() => {
    return allDays
      ? earthquakes
      : filterFeaturesByDay(earthquakes, selectedTime);
  }, [earthquakes, allDays, selectedTime]);

  return (
    <div className="relative h-full">
      <MapGL
        style={{ width: "100vw", height: "100vh" }}
        initialViewState={{
          latitude: 51.22,
          longitude: 5,
          zoom: 7,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v9"
        mapboxAccessToken={import.meta.env.VITE_APP_MAP_TOKEN}
      >
        {data && (
          <Source type="geojson" data={data as any}>
            <Layer {...heatmapLayer} />
          </Source>
        )}
        {merchants && (
          <Source id="merchants" type="geojson" data={merchants as any}>
            <Layer
              id="merchant-points"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-color": "#FF7A59",
                "circle-stroke-width": 1,
                "circle-stroke-color": "#fff",
              }}
            />
          </Source>
        )}
      </MapGL>
      <MapControlPanel
        startTime={timeRange[0]}
        endTime={timeRange[1]}
        selectedTime={selectedTime}
        allDays={allDays}
        onChangeTime={selectTime}
        onChangeAllDays={useAllDays}
      />
    </div>
  );
}
