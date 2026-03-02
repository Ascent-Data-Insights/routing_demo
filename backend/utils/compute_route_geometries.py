"""Pre-compute OSRM route geometries for every pair of known locations.

Produces route_geometries.json keyed by "fromNodeId-toNodeId" with the
simplified GeoJSON coordinates (already flipped to [lat, lon] for Leaflet),
distance (meters) and duration (seconds).

Usage:
    python compute_route_geometries.py
"""

import json
import time
import urllib.request
from pathlib import Path

OSRM_BASE = "https://router.project-osrm.org/route/v1/driving"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

with open(DATA_DIR / "config.jsonc") as f:
    config = json.load(f)

locations = [
    {"id": i, "lat": list(entry.values())[0][0], "lon": list(entry.values())[0][1]}
    for i, entry in enumerate(config["locations"])
]

n = len(locations)
print(f"Computing route geometries for {n} locations ({n * n} pairs)...")

geometries: dict[str, dict] = {}
total = n * n
done = 0

for origin in locations:
    for dest in locations:
        key = f"{origin['id']}-{dest['id']}"
        if origin["id"] == dest["id"]:
            geometries[key] = {
                "coordinates": [[origin["lat"], origin["lon"]]],
                "distance": 0,
                "duration": 0,
            }
            done += 1
            continue

        coords = f"{origin['lon']},{origin['lat']};{dest['lon']},{dest['lat']}"
        url = f"{OSRM_BASE}/{coords}?overview=simplified&geometries=geojson"

        try:
            with urllib.request.urlopen(url) as resp:
                data = json.loads(resp.read())
            route = data["routes"][0]
            # Flip GeoJSON [lon, lat] → [lat, lon] for Leaflet
            coords_latlon = [[c[1], c[0]] for c in route["geometry"]["coordinates"]]
            geometries[key] = {
                "coordinates": coords_latlon,
                "distance": route["distance"],
                "duration": route["duration"],
            }
        except Exception as e:
            print(f"  WARN: failed for {key}: {e}")
            # Fallback to straight line
            geometries[key] = {
                "coordinates": [
                    [origin["lat"], origin["lon"]],
                    [dest["lat"], dest["lon"]],
                ],
                "distance": 0,
                "duration": 0,
            }

        done += 1
        if done % 25 == 0:
            print(f"  {done}/{total} pairs done")
            # Be polite to the public OSRM server
            time.sleep(0.5)

with open(DATA_DIR / "route_geometries.json", "w") as f:
    json.dump(geometries, f)

print(f"Saved {len(geometries)} route geometries to route_geometries.json")
