# Digital Twin Architecture: City-Scale Vehicle Simulation

## Overview

This document describes the architecture for a **full city-scale traffic digital twin** that combines real-time data feeds with traffic simulation to produce live, realistic vehicle movement across entire metropolitan areas.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Mapbox)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ 3D Globe │ │ Vehicle  │ │ Sensor   │ │ CCTV Camera   │  │
│  │ Renderer │ │ Markers  │ │ Heatmaps │ │ Feeds Panel   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │
│       └─────────────┴────────────┴───────────────┘          │
│                          │ WebSocket + REST                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS (Current)               │
│  ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│  │ realtime-       │ │ traffic-       │ │ traffic-        │  │
│  │ vehicles        │ │ sensors        │ │ cameras         │  │
│  │ (GTFS-RT proxy) │ │ (PeMS/DOT)    │ │ (DOT CCTV)     │  │
│  └────────────────┘ └────────────────┘ └─────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           │
                           │ (Future: WebSocket bridge)
                           │
┌──────────────────────────┼──────────────────────────────────┐
│            SIMULATION SERVER (Self-Hosted)                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               Eclipse SUMO Engine                    │    │
│  │  • City road network from OpenStreetMap              │    │
│  │  • 100K-1M simulated vehicles                        │    │
│  │  • Real-time traffic signal control                  │    │
│  │  • Calibrated with real sensor data                  │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────┴──────────────────────────────┐    │
│  │              TraCI API (Python)                       │    │
│  │  • Extracts vehicle positions every 1-5 seconds      │    │
│  │  • Publishes to WebSocket/Redis                      │    │
│  │  • Accepts real-time calibration inputs              │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────┴──────────────────────────────┐    │
│  │           Data Calibration Pipeline                   │    │
│  │  • Ingests PeMS sensor feeds (speed, flow)           │    │
│  │  • Ingests GTFS-RT transit positions                  │    │
│  │  • Adjusts SUMO demand matrices in real-time         │    │
│  │  • Matches simulated vs real congestion               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Camera AI Pipeline (Optional)               │    │
│  │  • Receives CCTV camera feeds from DOT APIs          │    │
│  │  • Runs YOLOv8 object detection                       │    │
│  │  • DeepSORT multi-object tracking                     │    │
│  │  • Outputs vehicle count, speed, direction            │    │
│  │  • Feeds back into SUMO calibration                   │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Current Implementation (Lovable + Supabase)

**Status: LIVE**

| Layer | Source | Coverage | Update Rate |
|-------|--------|----------|-------------|
| Transit Vehicles | GTFS-RT (MBTA, MTA, LA Metro, SF Muni, CTA, WMATA, TriMet, TfL, TTC, Sydney) | 10 cities | 15s |
| Traffic Congestion | Mapbox Traffic v1 tiles | Global | Real-time |
| CCTV Cameras | 511NY, Caltrans DOT | US (NY, CA) | 5s image refresh |
| Traffic Sensors | PeMS, NYC DOT, Seattle DOT | US (CA, NYC, Seattle) | 30s |
| 3D Buildings | Mapbox/OSM fill-extrusion | Global | Static |

---

## Phase 2: SUMO Traffic Simulation Server

### Requirements
- **Server**: 8+ CPU cores, 32GB RAM, SSD (can use AWS EC2 c5.2xlarge ~$0.34/hr)
- **Software**: Eclipse SUMO, Python 3.10+, TraCI, Redis

### Setup Steps

#### 1. Generate Road Network from OpenStreetMap
```bash
# Download city OSM data
wget https://download.geofabrik.de/north-america/us/new-york-latest.osm.pbf

# Convert to SUMO network
netconvert --osm-files new-york-latest.osm.pbf -o nyc.net.xml \
  --geometry.remove --roundabouts.guess --ramps.guess \
  --junctions.join --tls.guess-signals --tls.join
```

#### 2. Generate Traffic Demand
```bash
# From NYC taxi GPS dataset (697M trips)
python tools/randomTrips.py -n nyc.net.xml -o trips.xml \
  --period 0.5 --fringe-factor 5

# Or from real OD matrices calibrated with sensor data
od2trips -n nyc.net.xml -d od_matrix.xml -o trips.xml
```

#### 3. Run Simulation with TraCI
```python
import traci
import json
import redis

r = redis.Redis()
traci.start(["sumo", "-c", "nyc.sumocfg", "--step-length", "1.0"])

while traci.simulation.getMinExpectedNumber() > 0:
    traci.simulationStep()
    vehicles = {}
    for veh_id in traci.vehicle.getIDList():
        pos = traci.vehicle.getPosition(veh_id)
        lon, lat = traci.simulation.convertGeo(pos[0], pos[1])
        vehicles[veh_id] = {
            "lat": lat, "lng": lon,
            "speed": traci.vehicle.getSpeed(veh_id),
            "heading": traci.vehicle.getAngle(veh_id),
            "type": traci.vehicle.getTypeID(veh_id),
        }
    r.publish("sumo-vehicles", json.dumps(vehicles))

traci.close()
```

#### 4. WebSocket Bridge to Frontend
```python
# FastAPI WebSocket server
from fastapi import FastAPI, WebSocket
import redis.asyncio as redis

app = FastAPI()
r = redis.Redis()

@app.websocket("/ws/vehicles")
async def vehicle_feed(websocket: WebSocket):
    await websocket.accept()
    pubsub = r.pubsub()
    await pubsub.subscribe("sumo-vehicles")
    async for message in pubsub.listen():
        if message["type"] == "message":
            await websocket.send_text(message["data"])
```

### Calibration with Real Data

The key to realistic simulation is **data assimilation** — continuously adjusting SUMO's traffic demand to match real-world observations:

```python
# Every 30 seconds, compare simulated vs real sensor data
def calibrate(sumo_speeds, real_speeds):
    for detector_id, real_speed in real_speeds.items():
        sim_speed = sumo_speeds.get(detector_id, 0)
        error = real_speed - sim_speed
        
        if abs(error) > 5:  # More than 5 mph difference
            # Adjust vehicle insertion rate on upstream edges
            edge = detector_to_edge[detector_id]
            current_rate = traci.edge.getLastStepVehicleNumber(edge)
            adjustment = error / real_speed  # Proportional control
            # Insert or remove vehicles to match real flow
```

---

## Phase 3: Camera AI Vehicle Detection

### Pipeline
```
CCTV Feed URL → Frame Extraction (ffmpeg) → YOLOv8 Detection → DeepSORT Tracking → Position Estimation → SUMO Calibration
```

### Implementation
```python
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

model = YOLO('yolov8n.pt')
tracker = DeepSort(max_age=30)

def process_frame(frame, camera_homography):
    results = model(frame, classes=[2, 3, 5, 7])  # car, motorcycle, bus, truck
    detections = []
    for r in results[0].boxes:
        x1, y1, x2, y2 = r.xyxy[0].tolist()
        conf = r.conf[0].item()
        detections.append(([x1, y1, x2-x1, y2-y1], conf, 'vehicle'))
    
    tracks = tracker.update_tracks(detections, frame=frame)
    
    vehicles = []
    for track in tracks:
        if not track.is_confirmed(): continue
        bbox = track.to_ltwh()
        # Convert pixel to GPS using camera homography matrix
        center = [bbox[0] + bbox[2]/2, bbox[1] + bbox[3]/2]
        lat, lng = pixel_to_gps(center, camera_homography)
        vehicles.append({
            'id': track.track_id,
            'lat': lat, 'lng': lng,
            'speed': estimate_speed(track),
        })
    
    return vehicles
```

---

## Phase 4: Historical Replay (NYC Taxi Dataset)

The NYC TLC taxi dataset contains 697M trips. This can be replayed on the map:

```python
# Stream historical taxi trips as "live" positions
import pandas as pd

df = pd.read_parquet('yellow_tripdata_2023-01.parquet')

for _, trip in df.iterrows():
    # Interpolate positions along route between pickup and dropoff
    start = (trip.pickup_latitude, trip.pickup_longitude)
    end = (trip.dropoff_latitude, trip.dropoff_longitude)
    duration = (trip.tpep_dropoff_datetime - trip.tpep_pickup_datetime).seconds
    
    # Use OSRM to get actual road route
    route = osrm_route(start, end)
    
    # Publish interpolated positions at 1Hz
    for t in range(0, duration):
        pos = interpolate_along_route(route, t / duration)
        publish_position(trip.VendorID, pos)
```

---

## Recommended Datasets

| Dataset | Size | Coverage | Use |
|---------|------|----------|-----|
| NYC TLC Taxi | 697M trips | NYC | Historical vehicle replay |
| T-Drive Beijing | 10K taxis | Beijing | Real GPS trajectories |
| UTD19 | 5B detections | 40 cities | Traffic flow calibration |
| Vehicle Energy Dataset | 383 cars | Ann Arbor MI | Driving behavior modeling |
| Waymo Open Dataset | 1M LiDAR frames | SF, Phoenix | Perception training |
| DeepScenario | 175K trajectories | Multiple cities | Urban vehicle tracking |

---

## Cost Estimates (Self-Hosted)

| Component | Option | Monthly Cost |
|-----------|--------|-------------|
| SUMO Server | AWS c5.2xlarge | ~$245/mo |
| Redis | ElastiCache t3.small | ~$25/mo |
| Camera AI | g4dn.xlarge (GPU) | ~$380/mo |
| Storage (datasets) | S3 500GB | ~$12/mo |
| **Total** | | **~$660/mo** |

For development/testing, a single $50/mo server can run SUMO with 100K vehicles.

---

## Integration with Current Frontend

The SUMO simulation server would connect to the existing map via:

1. **WebSocket connection** from React frontend to FastAPI server
2. **Vehicle position updates** streamed at 1-5 Hz
3. **Rendering** using the same marker system already built for GTFS-RT vehicles
4. **Toggle** in Urban Infrastructure panel: "Simulated Traffic (SUMO)"

The frontend code is already structured to handle this — the `useRealtimeVehicles` hook pattern can be extended with a WebSocket variant.
