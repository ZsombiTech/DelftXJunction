# Uber Auto

A smart courier optimization platform designed to help Uber Eats couriers maximize their earnings while promoting work-life balance and well-being.

## Overview

Our project uses machine learning and real-time data analysis to provide intelligent recommendations for courier drivers. The system predicts optimal pickup locations based on historical order data, weather conditions, cancellation rates, and time patterns, helping couriers make data-driven decisions about where to position themselves for maximum earnings per hour (EPH).

By optimizing route planning and pickup location selection, the platform not only helps couriers increase their financial opportunities but also reduces unnecessary travel time and stress, contributing to better work-life balance and overall well-being.

## Tech Stack

### Backend

- **Framework**: FastAPI (Python web framework for building APIs)
- **Database ORM**: Tortoise ORM with AsyncPG (PostgreSQL)
- **Machine Learning**:
  - TensorFlow/Keras (Neural network for EPH prediction)
  - scikit-learn (Preprocessing and model evaluation)
  - pandas & NumPy (Data processing)
- **Geospatial**: Shapely, TravelTime API
- **Authentication**: python-jose, passlib, bcrypt
- **Additional**:
  - uvicorn (ASGI server)
  - python-dotenv (Environment management)
  - Sentry SDK (Error tracking)

### Frontend

- **Framework**: React 19 with TypeScript
- **State Management**: Redux Toolkit with Redux Persist
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS 4
- **Mapping**:
  - Mapbox GL
  - react-map-gl
  - MapLibre GL Geocoder
- **3D Graphics**: Three.js with React Three Fiber & Drei
- **UI/UX**:
  - Framer Motion (Animations)
  - Headless UI (Accessible components)
  - Lucide React (Icons)
  - Notistack (Notifications)
- **Build Tool**: Vite
- **HTTP Client**: Axios

### Machine Learning Model

The core prediction system uses a deep neural network that:

- Predicts earnings per hour based on location, time, weather, and cancellation rates
- Incorporates haversine distance calculations for travel time estimation
- Optimizes net earnings by factoring in travel costs
- Trains on historical Uber Eats order data with weather and merchant information

## Features

- **Smart Location Recommendations**: ML-powered suggestions for optimal pickup locations
- **Real-time Earnings Prediction**: Estimate potential earnings per hour for different zones
- **Interactive Mapping**: Visualize hotspots, heatmaps, and recommended areas
- **Work-Life Balance**: Minimize dead miles and optimize working hours for better well-being
- **Data-Driven Insights**: Historical data analysis for informed decision-making

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
# Configure environment variables
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

Built for couriers who want to work smarter, not harder.
