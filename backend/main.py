import json
from pathlib import Path
from fastapi import FastAPI

app = FastAPI()

BASE_DIR = Path(__file__).parent

with open(BASE_DIR / "config.jsonc") as f:
    config = json.load(f)

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


@app.get("/nodes")
def get_nodes():
    return nodes
