"""
Science layer tests.

Runs deterministic scenarios against the real distance matrix and prints
pass/fail results. No external test framework needed — run with:

    cd backend && .venv/bin/python -m science.tests
"""

import json
import sys
from pathlib import Path

from science.structs import Container, TruckSize
from science.batcher import batch_containers
from science.router import nearest_neighbor_route, total_route_distance

DATA_DIR = Path(__file__).parent.parent / "data"


def load_matrix():
    with open(DATA_DIR / "distance_matrix.json") as f:
        d = json.load(f)
    return d["distance_matrix"], d["duration_matrix"], d["id_to_name"]


# ---------------------------------------------------------------------------
# Minimal test harness
# ---------------------------------------------------------------------------

_passed = 0
_failed = 0


def check(label: str, condition: bool, detail: str = ""):
    global _passed, _failed
    if condition:
        _passed += 1
        print(f"  PASS  {label}")
    else:
        _failed += 1
        print(f"  FAIL  {label}" + (f" — {detail}" if detail else ""))


# ---------------------------------------------------------------------------
# Router tests
# ---------------------------------------------------------------------------

def test_router(dist: list[list[int]]):
    print("\n── Router ──────────────────────────────────────")

    # Single destination — trivial route
    route = nearest_neighbor_route(0, [3], dist)
    check("single destination returns [dest]", route == [3], f"got {route}")

    # Empty destinations
    route = nearest_neighbor_route(0, [], dist)
    check("empty destinations returns []", route == [], f"got {route}")

    # Two destinations — nearest is picked first
    # Use nodes 0,1,2 — whichever of 1,2 is closer to 0 should come first
    route = nearest_neighbor_route(0, [1, 2], dist)
    check(
        "nearest destination visited first",
        dist[0][route[0]] <= dist[0][route[1]],
        f"route={route}, d[0][{route[0]}]={dist[0][route[0]]}, d[0][{route[1]}]={dist[0][route[1]]}",
    )

    # Total distance: source→a→b should equal dist[src][a] + dist[a][b]
    total = total_route_distance(0, [1, 2], dist)
    expected = dist[0][1] + dist[1][2]
    check("total_route_distance sums legs correctly", total == expected, f"{total} != {expected}")

    # NN route is no worse than reverse order (sanity check on heuristic quality)
    fwd = total_route_distance(0, [1, 2], dist)
    rev = total_route_distance(0, [2, 1], dist)
    nn = total_route_distance(0, nearest_neighbor_route(0, [1, 2], dist), dist)
    check("NN route <= worst of two orderings", nn <= max(fwd, rev), f"nn={nn}, max={max(fwd,rev)}")


# ---------------------------------------------------------------------------
# Batcher tests
# ---------------------------------------------------------------------------

def test_batcher(dist: list[list[int]], dur: list[list[int]]):
    print("\n── Batcher ─────────────────────────────────────")

    truck_size = TruckSize(AM=10, RE=6)

    # All containers from one source, one destination — should collapse to 1 truck
    containers = [
        Container("c0", "src-A", "dst-X", size=2, temperature="AM"),
        Container("c1", "src-A", "dst-X", size=3, temperature="AM"),
        Container("c2", "src-A", "dst-X", size=2, temperature="RE"),
    ]
    trucks = batch_containers(
        containers,
        source_node_ids={"src-A": 0},
        destination_node_ids={"dst-X": 3},
        truck_size=truck_size,
        distance_matrix=dist,
        duration_matrix=dur,
    )
    check("single source+dest → 1 truck", len(trucks) == 1, f"got {len(trucks)}")
    check("all containers assigned", sum(len(t.truck.containers) for t in trucks) == 3)

    # Capacity overflow forces a second truck
    containers2 = [
        Container("c0", "src-A", "dst-X", size=8, temperature="AM"),
        Container("c1", "src-A", "dst-X", size=8, temperature="AM"),  # won't fit with c0
    ]
    trucks2 = batch_containers(
        containers2,
        source_node_ids={"src-A": 0},
        destination_node_ids={"dst-X": 3},
        truck_size=truck_size,
        distance_matrix=dist,
        duration_matrix=dur,
    )
    check("AM overflow → 2 trucks", len(trucks2) == 2, f"got {len(trucks2)}")

    # RE capacity is independent of AM
    containers3 = [
        Container("c0", "src-A", "dst-X", size=5, temperature="AM"),
        Container("c1", "src-A", "dst-X", size=5, temperature="RE"),  # fits in same truck
    ]
    trucks3 = batch_containers(
        containers3,
        source_node_ids={"src-A": 0},
        destination_node_ids={"dst-X": 3},
        truck_size=truck_size,
        distance_matrix=dist,
        duration_matrix=dur,
    )
    check("AM+RE within capacity → 1 truck", len(trucks3) == 1, f"got {len(trucks3)}")

    # Two sources → trucks never mix sources
    containers4 = [
        Container("c0", "src-A", "dst-X", size=1, temperature="AM"),
        Container("c1", "src-B", "dst-X", size=1, temperature="AM"),
    ]
    trucks4 = batch_containers(
        containers4,
        source_node_ids={"src-A": 0, "src-B": 1},
        destination_node_ids={"dst-X": 3},
        truck_size=truck_size,
        distance_matrix=dist,
        duration_matrix=dur,
    )
    check("two sources → 2 trucks (never mixed)", len(trucks4) == 2, f"got {len(trucks4)}")
    source_ids = {t.truck.source_id for t in trucks4}
    check("each truck has a distinct source", source_ids == {"src-A", "src-B"}, f"got {source_ids}")

    # Route distance and duration are positive and non-zero for multi-stop trucks
    containers5 = [
        Container("c0", "src-A", "dst-X", size=1, temperature="AM"),
        Container("c1", "src-A", "dst-Y", size=1, temperature="AM"),
    ]
    trucks5 = batch_containers(
        containers5,
        source_node_ids={"src-A": 0},
        destination_node_ids={"dst-X": 3, "dst-Y": 5},
        truck_size=truck_size,
        distance_matrix=dist,
        duration_matrix=dur,
    )
    check("multi-stop route_distance_meters > 0", trucks5[0].route_distance_meters > 0)
    check("multi-stop route_duration_seconds > 0", trucks5[0].route_duration_seconds > 0)


# ---------------------------------------------------------------------------
# Integration: test_data.json
# ---------------------------------------------------------------------------

def test_integration(dist: list[list[int]], dur: list[list[int]], id_to_name: dict):
    print("\n── Integration (test_data.json) ────────────────")

    with open(DATA_DIR / "test_data.json") as f:
        td = json.load(f)

    # Build coord→node lookup (same logic as main.py)
    coord_to_node = {
        (round(float(name_lat_lon[0]), 6), round(float(name_lat_lon[1]), 6)): int(node_id)
        for node_id, name in id_to_name.items()
        # We need the actual lat/lon — load config for that
        for name_lat_lon in [_name_to_latlon(name)]
        if name_lat_lon
    }

    # Simpler: just assign sequential node IDs based on order in test_data
    all_locs = {loc["id"]: loc for loc in td["sources"] + td["destinations"]}
    # Map to arbitrary distinct node IDs for testing purposes
    loc_ids = list(all_locs.keys())
    node_map = {lid: i for i, lid in enumerate(loc_ids)}

    containers = [
        Container(
            container_id=c["container_id"],
            source_id=c["source_id"],
            destination_id=c["destination_id"],
            size=c["size"],
            temperature=c["temperature"],
        )
        for c in td["containers"]
    ]
    truck_size = TruckSize(**td["truck_size"])
    source_node_ids = {s["id"]: node_map[s["id"]] for s in td["sources"]}
    destination_node_ids = {d["id"]: node_map[d["id"]] for d in td["destinations"]}

    trucks = batch_containers(
        containers,
        source_node_ids=source_node_ids,
        destination_node_ids=destination_node_ids,
        truck_size=truck_size,
        distance_matrix=dist,
        duration_matrix=dur,
    )

    total_containers_assigned = sum(len(t.truck.containers) for t in trucks)
    check("all containers assigned", total_containers_assigned == len(containers),
          f"{total_containers_assigned}/{len(containers)}")

    # No truck exceeds capacity
    for rt in trucks:
        t = rt.truck
        check(
            f"truck {t.id[:8]} AM within capacity ({t.am_used}/{truck_size.AM})",
            t.am_used <= truck_size.AM,
        )
        check(
            f"truck {t.id[:8]} RE within capacity ({t.re_used}/{truck_size.RE})",
            t.re_used <= truck_size.RE,
        )

    # Each truck's ordered destinations match its container destinations
    for rt in trucks:
        assigned_dests = set(rt.truck.destination_ids)
        routed_dests = set(str(n) for n in rt.ordered_destination_node_ids)
        # Just check counts match (node IDs vs logical IDs differ)
        check(
            f"truck {rt.truck.id[:8]} stop count matches",
            len(rt.ordered_destination_node_ids) == len(rt.truck.destination_ids),
            f"{len(rt.ordered_destination_node_ids)} vs {len(rt.truck.destination_ids)}",
        )


def _name_to_latlon(name: str):
    """Stub — integration test uses sequential IDs instead of real coords."""
    return None


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    dist, dur, id_to_name = load_matrix()

    test_router(dist)
    test_batcher(dist, dur)
    test_integration(dist, dur, id_to_name)

    print(f"\n{'='*50}")
    print(f"  {_passed} passed, {_failed} failed")
    if _failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
