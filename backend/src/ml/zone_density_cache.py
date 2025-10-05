import json
import os
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Tuple
from src.utils.logger import logger


class ZoneDensityCache:
    def __init__(self, cache_file: str = "zoneDensityCache.json"):
        self.cache_file = cache_file
        self.cache: Dict[str, List[float]] = {}
        self.raw_data: List[Dict] = []

    def load_raw_data(self, data: str):
        """Load raw zone density data from string"""
        self.raw_data = data

        logger.info(f"Loaded {len(self.raw_data)} raw density records")

    def build_cache(self, time_window_minutes: int = 10):
        """
        Build cache with average pickup values grouped by weekday, hour, and minute intervals

        Args:
            time_window_minutes: Size of time window in minutes (default 10 for 10-minute intervals)
        """
        # Group data by weekday, hour, minute_interval, and zone
        grouped_data = defaultdict(lambda: defaultdict(list))

        for record in self.raw_data:
            timestamp = record["time"]
            pickups = record["pickups"]

            # Convert timestamp to datetime
            dt = datetime.fromtimestamp(timestamp)
            weekday = dt.weekday()  # 0=Monday, 6=Sunday
            hour = dt.hour
            minute_interval = (
                dt.minute // time_window_minutes) * time_window_minutes

            # Create time key: "weekday:hour:minute_interval"
            time_key = f"{weekday}:{hour}:{minute_interval:02d}"

            # Add pickup data for each zone
            for zone_idx, pickup_count in enumerate(pickups):
                grouped_data[time_key][zone_idx].append(pickup_count)

        # Calculate averages for each time period and zone
        self.cache = {}
        for time_key, zones_data in grouped_data.items():
            zone_averages = []
            max_zone_idx = max(zones_data.keys()) if zones_data else -1

            # Ensure we have data for all zones (fill missing zones with 0)
            for zone_idx in range(max_zone_idx + 1):
                if zone_idx in zones_data:
                    avg_pickups = sum(
                        zones_data[zone_idx]) / len(zones_data[zone_idx])
                    zone_averages.append(avg_pickups)
                else:
                    zone_averages.append(0.0)

            self.cache[time_key] = zone_averages

        logger.info(f"Built cache with {len(self.cache)} time periods")
        self.save_cache()

    def save_cache(self):
        """Save cache to file"""
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)
        logger.info(f"Saved zone density cache to {self.cache_file}")

    def load_cache(self):
        """Load cache from file"""
        try:
            with open(self.cache_file, 'r') as f:
                self.cache = json.load(f)
            logger.info(
                f"Loaded zone density cache with {len(self.cache)} time periods")
            return True
        except FileNotFoundError:
            logger.warning(f"Cache file {self.cache_file} not found")
            return False

    def get_density_for_time(self, dt: datetime, time_window_minutes: int = 10) -> List[float]:
        """
        Get average zone densities for a specific datetime

        Args:
            dt: Target datetime
            time_window_minutes: Time window size used when building cache

        Returns:
            List of average pickup counts per zone, or empty list if not found
        """
        weekday = dt.weekday()
        hour = dt.hour
        minute_interval = (dt.minute // time_window_minutes) * \
            time_window_minutes

        time_key = f"{weekday}:{hour}:{minute_interval:02d}"

        return self.cache.get(time_key, [])

    def get_density_for_current_time(self, time_window_minutes: int = 10) -> List[float]:
        """Get zone densities for current time"""
        return self.get_density_for_time(datetime.now(), time_window_minutes)


# Global cache instance
zone_density_cache = ZoneDensityCache()


def initialize_zone_density_cache(data: str = None, force_rebuild: bool = False):
    """
    Initialize zone density cache

    Args:
        data_file: Path to raw zone density data
        force_rebuild: If True, rebuild cache even if it exists
    """
    global zone_density_cache

    # Try to load existing cache first
    if not force_rebuild and zone_density_cache.load_cache():
        logger.info("Zone density cache loaded successfully")
        return

    # If cache doesn't exist or force rebuild, build new cache
    if data:
        logger.info("Building new zone density cache...")
        zone_density_cache.load_raw_data(data)
        zone_density_cache.build_cache()
    else:
        logger.warning(
            "No raw data provided. Cache will be empty.")


def get_current_zone_densities() -> List[float]:
    """Get zone densities for current time"""
    return zone_density_cache.get_density_for_current_time()


def get_zone_densities_for_time(target_time: datetime) -> List[float]:
    """Get zone densities for specific time"""
    return zone_density_cache.get_density_for_time(target_time)
