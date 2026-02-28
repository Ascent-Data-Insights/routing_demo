import json
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from science.structs import Container, TruckSize
from science.batcher import batch_containers

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

BASE_DIR = Path(__file__).parent

with open(BASE_DIR / "data" / "config.jsonc") as f:
    config = json.load(f)

with open(BASE_DIR / "data" / "distance_matrix.json") as f:
    _dm = json.load(f)

# Build node list: id, name, lat, lon
nodes = [
    {
        "id": i,
        "name": list(entry.keys())[0],
        "lat": list(entry.values())[0][0],
        "lon": list(entry.values())[0][1],
    }
    for i, entry in enumerate(config["locations"])
]

distance_matrix: list[list[int]] = _dm["distance_matrix"]
duration_matrix: list[list[int]] = _dm["duration_matrix"]

# lat/lon -> node ID index for fast lookup
_coord_to_node_id: dict[tuple[float, float], int] = {
    (node["lat"], node["lon"]): node["id"] for node in nodes
}


def _resolve_node_id(lat: str, lon: str) -> int:
    key = (float(lat), float(lon))
    node_id = _coord_to_node_id.get(key)
    if node_id is None:
        raise HTTPException(status_code=400, detail=f"Unknown location: lat={lat} lon={lon}")
    return node_id


# --- Request / Response models ---

class LocationIn(BaseModel):
    id: str
    lat: str
    lon: str

class ContainerIn(BaseModel):
    container_id: str
    source_id: str
    destination_id: str
    size: int
    temperature: Literal["AM", "RE"]

class TruckSizeIn(BaseModel):
    AM: int
    RE: int

class OptimizeRequest(BaseModel):
    sources: list[LocationIn]
    destinations: list[LocationIn]
    containers: list[ContainerIn]
    truck_size: TruckSizeIn

class TruckOut(BaseModel):
    id: str
    source_id: str
    destination_ids: list[str]
    container_ids: list[str]
    route_distance_meters: int
    route_duration_seconds: int

class OptimizeResponse(BaseModel):
    trucks: list[TruckOut]


# --- Endpoints ---

@app.get("/nodes")
def get_nodes():
    return nodes


@app.post("/optimize", response_model=OptimizeResponse)
def optimize(request: OptimizeRequest):
    source_node_ids = {s.id: _resolve_node_id(s.lat, s.lon) for s in request.sources}
    destination_node_ids = {d.id: _resolve_node_id(d.lat, d.lon) for d in request.destinations}

    containers = [
        Container(
            container_id=c.container_id,
            source_id=c.source_id,
            destination_id=c.destination_id,
            size=c.size,
            temperature=c.temperature,
        )
        for c in request.containers
    ]

    truck_size = TruckSize(AM=request.truck_size.AM, RE=request.truck_size.RE)

    routed_trucks = batch_containers(
        containers=containers,
        source_node_ids=source_node_ids,
        destination_node_ids=destination_node_ids,
        truck_size=truck_size,
        distance_matrix=distance_matrix,
        duration_matrix=duration_matrix,
    )

    # Invert destination_node_ids so we can map node ID -> logical dest ID
    node_to_dest_id = {v: k for k, v in destination_node_ids.items()}

    return OptimizeResponse(
        trucks=[
            TruckOut(
                id=rt.truck.id,
                source_id=rt.truck.source_id,
                destination_ids=[node_to_dest_id[n] for n in rt.ordered_destination_node_ids],
                container_ids=[c.container_id for c in rt.truck.containers],
                route_distance_meters=rt.route_distance_meters,
                route_duration_seconds=rt.route_duration_seconds,
            )
            for rt in routed_trucks
        ]
    )
