/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import Map, { Source, Layer } from "react-map-gl/mapbox";
import { heatmapLayer } from "./GeocoderControl";
import MapControlPanel from "./MapControlPanel";
import { useGetHeatmapZonesQuery } from "../redux/api/zonesApi";

export default function MapViewer() {
  const [earthquakes, setEarthQuakes] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [merchants, setMerchants] = useState<GeoJSON.FeatureCollection | null>(
    null
  );

  const { data: zones } = useGetHeatmapZonesQuery();

  useEffect(() => {
    fetch("https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson")
      .then((resp) => resp.json())
      .then((json) => {
        setEarthQuakes(json);
      })
      .catch((err) => console.error("Could not load data", err));
  }, []);

  useEffect(() => {
    if (!zones) return;

    const zonesToDisplay: GeoJSON.Feature[] = zones.map((zone) => {
      const polygons: GeoJSON.Position[][][] = zone.zones.flat().map((part) => {
        const rings: GeoJSON.Position[][] = [];
        if (part.shell && part.shell.length) {
          rings.push(part.shell as unknown as GeoJSON.Position[]);
        }

        if (part.holes && part.holes.length) {
          part.holes.forEach((h) =>
            rings.push(h as unknown as GeoJSON.Position[])
          );
        }
        return rings;
      });

      return {
        type: "Feature",
        properties: { name: zone.name },
        geometry: {
          type: "MultiPolygon",
          coordinates: polygons,
        } as GeoJSON.MultiPolygon,
      } as GeoJSON.Feature;
    });

    const formattedZones = {
      type: "FeatureCollection" as const,
      features: zonesToDisplay,
    } as GeoJSON.FeatureCollection;

    setMerchants(formattedZones);
  }, [zones]);

  const data = useMemo(() => {
    return earthquakes;
  }, [earthquakes]);

  return (
    <div className="relative h-full">
      <Map
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
              id="merchant-outline2"
              type="line"
              layout={{ "line-join": "bevel", "line-cap": "round" }}
              paint={{
                "line-color": "#005eff",
                "line-width": 2,
                "line-blur": 0,
                "line-opacity": 0.8,
              }}
            />
            <Layer
              id="merchant-polygon"
              type="fill"
              paint={{
                "fill-color": "#ff0000",
                "fill-opacity": 0.25,
              }}
            />
          </Source>
        )}
      </Map>
      <MapControlPanel />
    </div>
  );
}
