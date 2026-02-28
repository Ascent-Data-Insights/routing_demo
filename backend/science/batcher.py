"""
Greedy truck batcher.

Groups containers into trucks to minimise total driving distance.

All locations are referenced by their distance-matrix node ID (int).
Translation from lat/lon -> node ID is the responsibility of the caller.

Strategy:
1. Group containers by source — trucks never cross sources.
2. Within each source, greedily assign containers to trucks:
   - Prefer an existing truck already heading to the same destination.
   - Otherwise, prefer an existing truck with capacity whose current
     destinations are closest to the container's destination.
   - If no existing truck can fit the container, open a new truck.
3. After all containers are assigned, route each truck's destinations using
   the nearest-neighbor heuristic from router.py.
"""

import uuid
from collections import defaultdict
from dataclasses import dataclass

from science.structs import Container, Truck, TruckSize
from science.router import nearest_neighbor_route, total_route_distance


@dataclass
class RoutedTruck:
    truck: Truck
    ordered_destination_node_ids: list[int]
    route_distance_meters: int
    route_duration_seconds: int


def batch_containers(
    containers: list[Container],
    source_node_ids: dict[str, int],       # logical source ID -> node ID
    destination_node_ids: dict[str, int],  # logical destination ID -> node ID
    truck_size: TruckSize,
    distance_matrix: list[list[int]],
    duration_matrix: list[list[int]],
) -> list[RoutedTruck]:
    """
    Returns a list of RoutedTruck objects with containers assigned and
    destinations ordered by the nearest-neighbor route.
    """
    by_source: dict[str, list[Container]] = defaultdict(list)
    for c in containers:
        by_source[c.source_id].append(c)

    results: list[RoutedTruck] = []

    for src_id, src_containers in by_source.items():
        src_node = source_node_ids[src_id]
        open_trucks: list[Truck] = []

        for container in src_containers:
            c_node = destination_node_ids[container.destination_id]
            placed = False

            # 1. Truck already going to this exact destination with room.
            for truck in open_trucks:
                if container.destination_id in truck.destination_ids and truck.can_fit(container):
                    truck.add(container)
                    placed = True
                    break

            # 2. Any truck with capacity, preferring geographically closest.
            if not placed:
                capable = [t for t in open_trucks if t.can_fit(container)]
                if capable:
                    def _proximity(truck: Truck) -> int:
                        truck_dest_nodes = [destination_node_ids[d] for d in truck.destination_ids]
                        if not truck_dest_nodes:
                            return distance_matrix[src_node][c_node]
                        return min(distance_matrix[d][c_node] for d in truck_dest_nodes)

                    best = min(capable, key=_proximity)
                    best.add(container)
                    placed = True

            # 3. Open a new truck.
            if not placed:
                truck = Truck(id=str(uuid.uuid4()), source_id=src_id, truck_size=truck_size)
                truck.add(container)
                open_trucks.append(truck)

        # Route each truck's stops with nearest-neighbor from its source node.
        for truck in open_trucks:
            dest_nodes = [destination_node_ids[d] for d in truck.destination_ids]
            ordered_nodes = nearest_neighbor_route(src_node, dest_nodes, distance_matrix)
            results.append(RoutedTruck(
                truck=truck,
                ordered_destination_node_ids=ordered_nodes,
                route_distance_meters=total_route_distance(src_node, ordered_nodes, distance_matrix),
                route_duration_seconds=total_route_distance(src_node, ordered_nodes, duration_matrix),
            ))

    return results
