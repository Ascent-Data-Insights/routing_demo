"""
Truck batching algorithms.

batch_containers          — greedy baseline (original algorithm)
savings_batch_containers  — Clarke-Wright savings algorithm

All locations are referenced by their distance-matrix node ID (int).
Translation from lat/lon -> node ID is the responsibility of the caller.

Greedy strategy:
1. Group containers by source — trucks never cross sources.
2. Within each source, greedily assign containers to trucks:
   - Prefer an existing truck already heading to the same destination.
   - Otherwise, prefer an existing truck with capacity whose current
     destinations are closest to the container's destination.
   - If no existing truck can fit the container, open a new truck.
3. Route each truck with nearest-neighbor.

Clarke-Wright savings strategy:
1. Start with one truck per destination (direct source → dest → source).
2. Compute savings(i, j) = dist(src,i) + dist(src,j) - dist(i,j) for all pairs.
   Merging i and j into one route saves this amount vs. two separate trips.
3. Sort savings descending; merge pairs if capacity constraints allow.
4. Post-merge consolidation: repeatedly force the cheapest feasible merge of
   any remaining truck pair (even at a distance penalty) until no merge is
   possible — minimizing truck count.
5. Route each resulting truck with nearest-neighbor + 2-opt improvement.
"""

import uuid
from collections import defaultdict
from dataclasses import dataclass
from itertools import combinations

from science.structs import Container, Truck, TruckSize
from science.router import nearest_neighbor_route, total_route_distance, two_opt_improve, three_opt_improve


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


def savings_batch_containers(
    containers: list[Container],
    source_node_ids: dict[str, int],
    destination_node_ids: dict[str, int],
    truck_size: TruckSize,
    distance_matrix: list[list[int]],
    duration_matrix: list[list[int]],
) -> list[RoutedTruck]:
    """
    Clarke-Wright savings algorithm with 2-opt route improvement.

    Tends to produce fewer trucks and shorter total distance than the greedy
    approach, especially when many containers share nearby destinations.
    """
    by_source: dict[str, list[Container]] = defaultdict(list)
    for c in containers:
        by_source[c.source_id].append(c)

    results: list[RoutedTruck] = []

    for src_id, src_containers in by_source.items():
        src_node = source_node_ids[src_id]

        # Group containers by destination — each dest starts as its own "route"
        by_dest: dict[str, list[Container]] = defaultdict(list)
        for c in src_containers:
            by_dest[c.destination_id].append(c)

        # One truck per destination to start
        trucks: dict[str, Truck] = {}
        for dest_id, dest_containers in by_dest.items():
            t = Truck(id=str(uuid.uuid4()), source_id=src_id, truck_size=truck_size)
            for c in dest_containers:
                if t.can_fit(c):
                    t.add(c)
                else:
                    # Overflow: open another truck for this destination
                    trucks[t.id] = t
                    t = Truck(id=str(uuid.uuid4()), source_id=src_id, truck_size=truck_size)
                    t.add(c)
            trucks[t.id] = t

        # Compute Clarke-Wright savings for all pairs of destinations.
        # savings(i, j) = dist(src→i) + dist(src→j) - dist(i→j)
        # A higher saving means combining i and j onto one route is more valuable.
        dest_ids = list(by_dest.keys())
        savings: list[tuple[int, str, str]] = []
        for di, dj in combinations(dest_ids, 2):
            ni = destination_node_ids[di]
            nj = destination_node_ids[dj]
            s = distance_matrix[src_node][ni] + distance_matrix[src_node][nj] - distance_matrix[ni][nj]
            savings.append((s, di, dj))
        savings.sort(reverse=True)

        # Greedily merge truck pairs in savings order if capacity allows.
        # We track which truck each destination currently belongs to.
        dest_to_truck: dict[str, str] = {
            dest_id: t_id
            for t_id, t in trucks.items()
            for dest_id in t.destination_ids
        }

        for _, di, dj in savings:
            ti_id = dest_to_truck.get(di)
            tj_id = dest_to_truck.get(dj)
            if ti_id is None or tj_id is None or ti_id == tj_id:
                continue  # already merged or missing

            ti = trucks[ti_id]
            tj = trucks[tj_id]

            # Check if all of tj's containers fit into ti cumulatively.
            # We must simulate adding them in sequence — can_fit checks remaining
            # capacity, so we can't test each container independently (that would
            # allow the combined load to exceed capacity).
            am_after = ti.am_used
            re_after = ti.re_used
            can_merge = True
            for c in tj.containers:
                if c.temperature == 'AM':
                    am_after += c.size
                else:
                    re_after += c.size
                if am_after > truck_size.AM or re_after > truck_size.RE:
                    can_merge = False
                    break
            if not can_merge:
                continue

            # Merge tj into ti
            for c in tj.containers:
                ti.add(c)
            # Update dest→truck mapping for everything that was in tj
            for dest_id in list(dest_to_truck):
                if dest_to_truck[dest_id] == tj_id:
                    dest_to_truck[dest_id] = ti_id
            del trucks[tj_id]

        # Post-merge consolidation: force-merge truck pairs to reduce truck count,
        # even when savings is negative (i.e., accepting a small distance penalty).
        # We repeatedly find the cheapest feasible merge until none remain.
        changed = True
        while changed:
            changed = False
            truck_list = list(trucks.values())
            best_merge: tuple[int, str, str] | None = None  # (extra_distance, ti_id, tj_id)

            for ti, tj in combinations(truck_list, 2):
                am_after = ti.am_used
                re_after = ti.re_used
                can_merge = True
                for c in tj.containers:
                    if c.temperature == 'AM':
                        am_after += c.size
                    else:
                        re_after += c.size
                    if am_after > truck_size.AM or re_after > truck_size.RE:
                        can_merge = False
                        break
                if not can_merge:
                    continue

                # Cost of merging: route ti's stops + tj's stops together vs separately.
                ti_nodes = [destination_node_ids[d] for d in ti.destination_ids]
                tj_nodes = [destination_node_ids[d] for d in tj.destination_ids]
                merged_nodes = ti_nodes + tj_nodes
                merged_route = two_opt_improve(src_node, nearest_neighbor_route(src_node, merged_nodes, distance_matrix), distance_matrix)
                merged_dist = total_route_distance(src_node, merged_route, distance_matrix)
                separate_dist = (
                    total_route_distance(src_node, nearest_neighbor_route(src_node, ti_nodes, distance_matrix), distance_matrix) +
                    total_route_distance(src_node, nearest_neighbor_route(src_node, tj_nodes, distance_matrix), distance_matrix)
                )
                extra = merged_dist - separate_dist

                if best_merge is None or extra < best_merge[0]:
                    best_merge = (extra, ti.id, tj.id)

            if best_merge is not None:
                _, ti_id, tj_id = best_merge
                ti = trucks[ti_id]
                tj = trucks[tj_id]
                for c in tj.containers:
                    ti.add(c)
                del trucks[tj_id]
                changed = True

        # Route each merged truck with NN + 2-opt improvement
        for truck in trucks.values():
            dest_nodes = [destination_node_ids[d] for d in truck.destination_ids]
            nn_route = nearest_neighbor_route(src_node, dest_nodes, distance_matrix)
            ordered_nodes = two_opt_improve(src_node, nn_route, distance_matrix)
            results.append(RoutedTruck(
                truck=truck,
                ordered_destination_node_ids=ordered_nodes,
                route_distance_meters=total_route_distance(src_node, ordered_nodes, distance_matrix),
                route_duration_seconds=total_route_distance(src_node, ordered_nodes, duration_matrix),
            ))

    return results
