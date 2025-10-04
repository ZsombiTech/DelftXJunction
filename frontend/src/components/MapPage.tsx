/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Map, { Source, Layer, type MapRef } from "react-map-gl/mapbox";
import { XIcon, Clock, MapPin, Gauge, User } from "lucide-react"; // Added icons for the panel
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CustomLayerInterface } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { enqueueSnackbar } from "notistack";

interface MapPageProps {
  onClose: () => void;
  start: [number, number]; // [lng, lat]
  waypoints: [number, number][]; // list of coordinates
  driverName: string; // Name of the driver
}

const MAP_TOKEN = import.meta.env.VITE_APP_MAP_TOKEN;

// --- Utility Functions (Same as your original code) ---

// Helper function to calculate bearing (direction of travel)
const calculateBearing = (
  start: [number, number],
  end: [number, number]
): number => {
  const startLat = (start[1] * Math.PI) / 180;
  const startLng = (start[0] * Math.PI) / 180;
  const endLat = (end[1] * Math.PI) / 180;
  const endLng = (end[0] * Math.PI) / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  const bearingRad = Math.atan2(y, x);
  const bearingDeg = (bearingRad * 180) / Math.PI;

  return (bearingDeg + 360) % 360; // Normalize to 0-360 degrees
};

// Create 3D car layer using Three.js
const create3DCarLayer = (
  initialCoordinates: [number, number],
  carPositionRef: React.MutableRefObject<mapboxgl.MercatorCoordinate>,
  carBearingRef: React.MutableRefObject<number>
): CustomLayerInterface => {
  let camera: THREE.Camera;
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;
  let carModel: THREE.Group | null = null;

  return {
    id: "3d-car-model",
    type: "custom",
    renderingMode: "3d",

    onAdd(map, gl) {
      camera = new THREE.Camera();
      scene = new THREE.Scene();

      // --- Ultra Bright Lighting Setup (10x lighter look) ---
      const ambientLight = new THREE.AmbientLight(0xffffff, 10); // huge ambient brightness
      scene.add(ambientLight);

      // Strong sunlight
      const sunLight = new THREE.DirectionalLight(0xffffff, 12);
      sunLight.position.set(100, 200, 300);
      scene.add(sunLight);

      // Backlight for strong edge glow
      const backLight = new THREE.DirectionalLight(0xffffff, 8);
      backLight.position.set(-150, -100, 150);
      scene.add(backLight);

      // Fill light from the side
      const sideLight = new THREE.DirectionalLight(0xffffff, 6);
      sideLight.position.set(200, 0, 100);
      scene.add(sideLight);

      // Hemisphere for sky–ground glow
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 8);
      hemiLight.position.set(0, 300, 0);
      scene.add(hemiLight);

      // Bright local point lights around the car
      const carLight1 = new THREE.PointLight(0xffffff, 10, 200);
      carLight1.position.set(5, 5, 5);
      scene.add(carLight1);

      // Load 3D car model
      const gltfLoader = new GLTFLoader();
      gltfLoader.load("/src/assets/models/Car-Model/car_red.glb", (gltf) => {
        carModel = gltf.scene;

        carModel.scale.set(4, 4, 4);
        carModel.rotation.x = -Math.PI / 2;
        carModel.rotation.z = Math.PI;

        scene.add(carModel);
      });

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: false, // important for mobile compatibility
        alpha: false,
      });

      renderer.autoClear = false;

      // Initial car position
      carPositionRef.current = mapboxgl.MercatorCoordinate.fromLngLat(
        initialCoordinates,
        0
      );
    },

    render(gl, matrix) {
      if (!gl) return;
      if (!carModel) return;

      const rotationZ = new THREE.Matrix4().makeRotationZ(
        Math.PI / 2 - carBearingRef.current * (Math.PI / 180)
      );

      const translation = new THREE.Matrix4().makeTranslation(
        carPositionRef.current.x,
        carPositionRef.current.y,
        carPositionRef.current.z
      );

      const scale = new THREE.Matrix4().makeScale(
        carPositionRef.current.meterInMercatorCoordinateUnits(),
        -carPositionRef.current.meterInMercatorCoordinateUnits(),
        carPositionRef.current.meterInMercatorCoordinateUnits()
      );

      const m = new THREE.Matrix4()
        .fromArray(matrix)
        .multiply(translation)
        .multiply(rotationZ)
        .multiply(scale);

      camera.projectionMatrix = m;
      renderer.resetState();
      renderer.render(scene, camera);
    },
  };
};

// --- Main Component ---

const MapPage: React.FC<MapPageProps> = ({
  onClose,
  start,
  waypoints,
  driverName,
}) => {
  const [route, setRoute] = useState<GeoJSON.FeatureCollection | null>(null);
  // Store full route duration and distance from the API response
  const [routeInfo, setRouteInfo] = useState<{
    duration: number; // in seconds
    distance: number; // in meters
  } | null>(null);
  const mapRef = useRef<MapRef>(null);

  const positionIndexRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const carPositionRef = useRef<mapboxgl.MercatorCoordinate>(
    mapboxgl.MercatorCoordinate.fromLngLat(start, 0)
  );
  const carBearingRef = useRef<number>(0);

  const [currentLngLat, setCurrentLngLat] = useState<[number, number]>(start);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const routeCoordinates = route?.features[0]?.geometry
    ? (route?.features[0]?.geometry as any).coordinates
    : [];

  // 1. Fetch route from Mapbox Directions API
  useEffect(() => {
    if (!start || waypoints.length === 0) return;
    const coords = [start, ...waypoints];
    const coordinatesString = coords.map((c) => c.join(",")).join(";");

    const fetchRoute = async () => {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?geometries=geojson&overview=full&access_token=${MAP_TOKEN}&steps=true` // steps=true gives more detail
      );
      const data = await res.json();
      if (data.routes?.length) {
        const primaryRoute = data.routes[0];
        const routeGeoJSON: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: primaryRoute.geometry,
              properties: {},
            },
          ],
        };
        setRoute(routeGeoJSON);
        setRouteInfo({
          duration: primaryRoute.duration, // total time in seconds
          distance: primaryRoute.distance, // total distance in meters
        });
        positionIndexRef.current = 0;
      }
    };
    fetchRoute();
  }, [start, waypoints]);

  // 2. Animate car along route
  const animateNavigation = useCallback(() => {
    const map = mapRef.current?.getMap();
    const coords = routeCoordinates;

    if (!map || coords.length === 0) {
      animationFrameRef.current = requestAnimationFrame(animateNavigation);
      return;
    }

    const index = positionIndexRef.current;
    if (index >= coords.length - 1) {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      map.easeTo({ pitch: 0, duration: 2000 });
      return;
    }

    const nextCoord = coords[index + 1] as [number, number];
    const t = 0.1; // Animation speed/step size

    const [lng, lat] = [
      currentLngLat[0] + (nextCoord[0] - currentLngLat[0]) * t,
      currentLngLat[1] + (nextCoord[1] - currentLngLat[1]) * t,
    ];

    // Update bearing
    const newBearing = calculateBearing(currentLngLat, [lng, lat]);
    carBearingRef.current = newBearing;

    // Update car position
    carPositionRef.current = mapboxgl.MercatorCoordinate.fromLngLat(
      [lng, lat],
      0
    );

    setCurrentLngLat([lng, lat]);

    const distance = Math.hypot(nextCoord[0] - lng, nextCoord[1] - lat);
    if (distance < 0.00001) positionIndexRef.current += 1;

    map.easeTo({
      center: [lng, lat],
      bearing: newBearing,
      duration: 50,
      easing: (t) => t,
    });

    animationFrameRef.current = requestAnimationFrame(animateNavigation);
  }, [routeCoordinates, currentLngLat]);

  // 3. Start animation when route and map are ready
  useEffect(() => {
    if (routeCoordinates.length > 0 && isMapLoaded) {
      animationFrameRef.current = requestAnimationFrame(animateNavigation);
    }
    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [routeCoordinates, isMapLoaded, animateNavigation]);

  // 4. Map load handler
  const handleMapLoad = useCallback(
    (e: any) => {
      const map = e.target;
      setIsMapLoaded(true);

      const layer = create3DCarLayer(start, carPositionRef, carBearingRef);
      map.addLayer(layer);
    },
    [start]
  );

  // 5. Resize map
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // --- STATISTICAL PANEL LOGIC ---

  // Calculate simulated remaining time and distance (simplified)
  const stats = useMemo(() => {
    if (!routeInfo)
      return {
        remainingTime: "...",
        remainingDistance: "...",
        driverName: driverName,
        vehicle: "Tesla Model 3", // Placeholder
      };

    // Simulate progress based on the current position index
    const totalPoints = routeCoordinates.length;
    const currentPoints = positionIndexRef.current;
    const progress = totalPoints > 0 ? currentPoints / totalPoints : 0;

    // Estimate remaining distance and time
    const remainingDistanceMeters = routeInfo.distance * (1 - progress);
    const remainingTimeSeconds = routeInfo.duration * (1 - progress);

    const distanceKm = (remainingDistanceMeters / 1000).toFixed(1);

    // Convert seconds to 'X min'
    const remainingMinutes = Math.max(1, Math.ceil(remainingTimeSeconds / 60));

    // Calculate Estimated Time of Arrival (ETA)
    const eta = new Date(
      new Date().getTime() + remainingTimeSeconds * 1000
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (distanceKm == "0.0") {
      setIsSuccessModalOpen(true);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return {
        remainingTime: "0 min",
        remainingDistance: "0 km",
        eta,
        driverName: driverName,
        vehicle: "Tesla Model 3", // Placeholder
      };
    }

    return {
      remainingTime: `${remainingMinutes} min`,
      remainingDistance: `${distanceKm} km`,
      eta,
      driverName: driverName,
      vehicle: "Tesla Model 3", // Placeholder
    };
  }, [routeInfo, driverName, routeCoordinates.length]);
  // Note: The dependency `positionIndexRef.current` isn't a true dependency
  // as it's a ref and doesn't trigger a re-render. We'll rely on the
  // `setCurrentLngLat` state update to trigger the re-render.

  const onCloseConfirmationModal = () => {
    setIsCloseModalOpen(false);
  };

  return (
    <div className="w-full h-full relative bg-gray-100">
      <Dialog
        open={isSuccessModalOpen}
        as="div"
        className="relative z-[1000] focus:outline-none"
        onClose={() => setIsSuccessModalOpen(false)}
      >
        <div className="fixed inset-0 z-10 w-screen h-screen overflow-y-auto z-[1000]">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-white/80 p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
            >
              <DialogTitle
                as="h3"
                className="text-xl font-semibold text-gray-900"
              >
                Trip Completed!
              </DialogTitle>
              <p className="mt-2 text-sm text-gray-600">
                You have successfully reached your destination.
              </p>
              <div className="mt-6 flex gap-3">
                <Button
                  className="cursor-pointer flex-1 rounded-full bg-black py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-black/80 focus:outline-none"
                  onClick={() => setIsSuccessModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Modal for Ending Trip */}
      <Dialog
        open={isCloseModalOpen}
        as="div"
        className="relative z-[1000] focus:outline-none"
        onClose={onCloseConfirmationModal}
      >
        <div className="fixed inset-0 z-10 w-screen h-screen overflow-y-auto z-[1000]">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-white/80 p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
            >
              <DialogTitle
                as="h3"
                className="text-xl font-semibold text-gray-900"
              >
                End Navigation?
              </DialogTitle>

              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to exit the active trip?
              </p>

              <div className="mt-6 flex gap-3">
                <Button
                  className="cursor-pointer flex-1 rounded-full bg-gray-100 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-200 focus:outline-none"
                  onClick={onCloseConfirmationModal}
                >
                  Continue Trip
                </Button>

                <Button // Primary action: End Trip (calls original onClose prop)
                  className="cursor-pointer flex-1 rounded-full bg-red-600 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 focus:outline-none"
                  onClick={onClose}
                >
                  End Trip
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Top Bar for Navigation Instruction */}
      <h1 className="text-xl font-semibold text-center p-4 bg-white/70 backdrop-blur-sm absolute top-0 left-0 right-0 z-20 shadow-md">
        Follow the route
      </h1>

      {/* Close Button */}
      <button
        onClick={() => setIsCloseModalOpen(true)}
        className="cursor-pointer ml-0 xl:ml-4 absolute top-2 left-4 w-10 h-10 bg-black text-white rounded-full z-20 flex items-center justify-center hover:bg-gray-800 transition"
      >
        <XIcon className="w-6 h-6" />
      </button>

      {/* Mapbox Map */}
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: start[0],
          latitude: start[1],
          zoom: 17,
          pitch: 60,
          bearing: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/navigation-day-v1"
        mapboxAccessToken={MAP_TOKEN}
        onLoad={handleMapLoad}
      >
        {route && (
          <Source id="route" type="geojson" data={route}>
            <Layer
              id="route-line"
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{ "line-color": "#007AFF", "line-width": 8 }}
            />
          </Source>
        )}
      </Map>

      {/* Statistical Panel (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 w-80 p-4 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-gray-100 transition-all duration-300">
        {/* Header: ETA and Driver */}
        <div className="flex justify-between items-start border-b pb-3 mb-3">
          <div>
            <div className="flex items-center text-3xl font-bold text-gray-900">
              <Clock className="w-6 h-6 mr-2 text-blue-600" />
              {stats.remainingTime}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              ETA:{" "}
              <span className="font-medium text-gray-700">{stats.eta}</span>
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Remaining Distance */}
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-gray-500 mr-2" />
            <div>
              <p className="font-semibold text-gray-800">
                {stats.remainingDistance}
              </p>
              <p className="text-xs text-gray-500">Distance Left</p>
            </div>
          </div>

          {/* Driver Name (Simulated) */}
          <div className="flex items-center">
            <User className="w-4 h-4 text-gray-500 mr-2" />
            <div>
              <p className="font-semibold text-gray-800">{stats.driverName}</p>
              <p className="text-xs text-gray-500">Driver</p>
            </div>
          </div>

          {/* Vehicle Info (Simulated) */}
          <div className="flex items-center">
            <Gauge className="w-4 h-4 text-gray-500 mr-2" />
            <div>
              <p className="font-semibold text-gray-800">{stats.vehicle}</p>
              <p className="text-xs text-gray-500">Vehicle</p>
            </div>
          </div>

          {/* Current Speed (Simulated) */}
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-500 mr-2" />
            <div>
              <p className="font-semibold text-gray-800">55 km/h</p>
              <p className="text-xs text-gray-500">Current Speed</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          className="cursor-pointer w-full mt-4 py-2 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition"
          onClick={() => {
            enqueueSnackbar("Redirecting to emergency services...", {
              variant: "info",
            });
            window.open("tel:112"); // Opens the phone dialer with emergency number
          }}
        >
          Report emergency
        </button>
      </div>
    </div>
  );
};

export default MapPage;
