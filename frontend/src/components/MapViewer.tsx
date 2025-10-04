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
      .catch((err) => console.error("Could not load data", err));
  }, []);

  useEffect(() => {
    const heatmap = [
      [4.4702926, 51.925125],
      [4.4705105, 51.92499],
      [4.4705105, 51.92337],
      [4.4700747, 51.923103],
      [4.4702926, 51.922966],
      [4.4707284, 51.922966],
      [4.4711647, 51.923237],
      [4.4716005, 51.923237],
      [4.4718184, 51.92337],
      [4.4718184, 51.923912],
      [4.472037, 51.924046],
      [4.473127, 51.92337],
      [4.473127, 51.922832],
      [4.4729085, 51.9227],
      [4.4724727, 51.9227],
      [4.4718184, 51.922295],
      [4.472037, 51.922157],
      [4.4724727, 51.92243],
      [4.473345, 51.92243],
      [4.4735627, 51.922295],
      [4.4735627, 51.922024],
      [4.4737806, 51.92189],
      [4.4739985, 51.922024],
      [4.4739985, 51.92337],
      [4.474217, 51.923508],
      [4.474653, 51.923508],
      [4.4750886, 51.923775],
      [4.475525, 51.923775],
      [4.475743, 51.923912],
      [4.475743, 51.924183],
      [4.4759607, 51.924316],
      [4.478577, 51.924316],
      [4.479013, 51.924587],
      [4.479449, 51.924316],
      [4.479667, 51.92445],
      [4.479667, 51.92526],
      [4.480103, 51.92553],
      [4.480103, 51.9258],
      [4.480321, 51.925934],
      [4.480757, 51.925934],
      [4.481193, 51.925663],
      [4.481629, 51.925663],
      [4.4829373, 51.92647],
      [4.483809, 51.925934],
      [4.4840274, 51.926067],
      [4.4840274, 51.927147],
      [4.483591, 51.927418],
      [4.483591, 51.928226],
      [4.484463, 51.928764],
      [4.484463, 51.929035],
      [4.484681, 51.92917],
      [4.4851174, 51.928898],
      [4.485989, 51.92944],
      [4.4864254, 51.92944],
      [4.4866433, 51.929573],
      [4.4866433, 51.929844],
      [4.485771, 51.93038],
      [4.485771, 51.930923],
      [4.4862075, 51.93119],
      [4.485989, 51.931328],
      [4.483809, 51.931328],
      [4.483591, 51.93119],
      [4.483591, 51.930923],
      [4.483373, 51.930786],
      [4.4831553, 51.930923],
      [4.4831553, 51.931732],
      [4.483591, 51.932],
      [4.483591, 51.932808],
      [4.483373, 51.932945],
      [4.4829373, 51.932945],
      [4.482719, 51.932808],
      [4.482719, 51.93254],
      [4.481629, 51.931866],
      [4.481411, 51.932],
      [4.481411, 51.93227],
      [4.4818473, 51.93254],
      [4.4818473, 51.93308],
      [4.482283, 51.93335],
      [4.482065, 51.933483],
      [4.481629, 51.933212],
      [4.481193, 51.933212],
      [4.480975, 51.93308],
      [4.480975, 51.93254],
      [4.480757, 51.932404],
      [4.480103, 51.932808],
      [4.480103, 51.93308],
      [4.479885, 51.933212],
      [4.479449, 51.932945],
      [4.478577, 51.932945],
      [4.478141, 51.932674],
      [4.477705, 51.932674],
      [4.477487, 51.93254],
      [4.477487, 51.93227],
      [4.477051, 51.932],
      [4.477051, 51.931732],
      [4.476833, 51.931595],
      [4.476397, 51.931595],
      [4.4761786, 51.931732],
      [4.4761786, 51.932],
      [4.475525, 51.932404],
      [4.4750886, 51.932404],
      [4.474217, 51.932945],
      [4.4737806, 51.932945],
      [4.473345, 51.933212],
      [4.473127, 51.93308],
      [4.473127, 51.93254],
      [4.4724727, 51.932137],
      [4.4722548, 51.93227],
      [4.4722548, 51.93254],
      [4.4716005, 51.932945],
      [4.4707284, 51.932945],
      [4.4702926, 51.933212],
      [4.4698567, 51.933212],
      [4.4694204, 51.933483],
      [4.4689846, 51.933483],
      [4.4687667, 51.93335],
      [4.4689846, 51.933212],
      [4.4694204, 51.933212],
      [4.4696383, 51.93308],
      [4.4696383, 51.932808],
      [4.4694204, 51.932674],
      [4.4689846, 51.932674],
      [4.4687667, 51.93254],
      [4.4689846, 51.932404],
      [4.4698567, 51.932404],
      [4.4700747, 51.93227],
      [4.4700747, 51.932],
      [4.4692025, 51.93146],
      [4.4692025, 51.93119],
      [4.4700747, 51.930653],
      [4.4700747, 51.93038],
      [4.4711647, 51.929707],
      [4.4716005, 51.929707],
      [4.472037, 51.92944],
      [4.4724727, 51.92944],
      [4.4726906, 51.929302],
      [4.4726906, 51.928764],
      [4.4729085, 51.92863],
      [4.473345, 51.92863],
      [4.4735627, 51.928493],
      [4.4735627, 51.928226],
      [4.473345, 51.92809],
      [4.4729085, 51.92809],
      [4.4716005, 51.92728],
      [4.4711647, 51.92755],
      [4.4707284, 51.92728],
      [4.4702926, 51.92728],
      [4.4698567, 51.927013],
      [4.4694204, 51.927013],
      [4.4692025, 51.927147],
      [4.4692025, 51.927418],
      [4.4698567, 51.927822],
      [4.4702926, 51.927822],
      [4.4705105, 51.927956],
      [4.4700747, 51.928226],
      [4.4700747, 51.928493],
      [4.4698567, 51.92863],
      [4.4685483, 51.92863],
      [4.4681125, 51.92836],
      [4.4676766, 51.92836],
      [4.4674582, 51.928226],
      [4.4674582, 51.927956],
      [4.4678946, 51.927685],
      [4.4678946, 51.927418],
      [4.4683304, 51.927147],
      [4.4683304, 51.92634],
      [4.4681125, 51.926205],
      [4.4676766, 51.926205],
      [4.4674582, 51.926067],
      [4.4674582, 51.92553],
      [4.4676766, 51.925396],
      [4.4689846, 51.925396],
      [4.4694204, 51.925125],
      [4.4702926, 51.925125],
    ];

    const formattedHeatmap = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [heatmap],
          },
        },
      ],
    };
    setMerchants(formattedHeatmap);
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
              id="merchant-outline2"
              type="line"
              line-join="bevel"
              lince-cap="round"
              paint={{
                "line-color": "#005eff",
                "line-width": 20,
                "line-blur": 20,
                "line-opacity": 0.3,
              }}
            />
            <Layer
              id="merchant-polygon"
              type="fill"
              paint={{
                "fill-color": "#ff0000",
                "fill-opacity": 0.5,
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
