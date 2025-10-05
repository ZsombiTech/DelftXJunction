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

  useEffect(() => {
    /* global fetch */
    fetch("https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson")
      .then((resp) => resp.json())
      .then((json) => {
        // Note: In a real application you would do a validation of JSON data before doing anything with it,
        // but for demonstration purposes we ingore this part here and just trying to select needed data...

        setEarthQuakes(json);
      })
      .catch((err) => console.error("Could not load data", err));
  }, []);

  const { data: zones } = useGetHeatmapZonesQuery();
  console.log(useGetHeatmapZonesQuery());
  useEffect(() => {
    if (!zones) return;

    // Build proper MultiPolygon coordinates from backend format.
    // backend: zone.zones is Array<Array<{ shell, holes }>>
    // We'll turn every inner "part" (object with shell and holes) into a Polygon (array of rings),
    // then collect them into a MultiPolygon (array of polygons).
    const zonesToDisplay: GeoJSON.Feature[] = zones.map((zone) => {
      // flatten all parts into polygons
      const polygons: GeoJSON.Position[][][] = zone.zones
        .flat() // bring all part objects to one array
        .map((part) => {
          // each part.shell is an exterior ring (array of [lng, lat])
          const rings: GeoJSON.Position[][] = [];
          if (part.shell && part.shell.length) {
            rings.push(part.shell as unknown as GeoJSON.Position[]);
          }
          // append any holes (each is a ring)
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
