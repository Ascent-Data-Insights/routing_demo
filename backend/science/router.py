"""
Routing algorithms.

nearest_neighbor_route  — greedy heuristic (baseline)
two_opt_improve         — local-search improvement over any initial route
"""


def nearest_neighbor_route(
    source_node_id: int,
    destination_node_ids: list[int],
    distance_matrix: list[list[int]],
) -> list[int]:
    """
    Returns an ordered list of destination node IDs representing the visit order.
    Does not include the source in the returned list.
    """
    if not destination_node_ids:
        return []

    unvisited = list(destination_node_ids)
    route = []
    current = source_node_id

    while unvisited:
        nearest = min(unvisited, key=lambda node: distance_matrix[current][node])
        route.append(nearest)
        unvisited.remove(nearest)
        current = nearest

    return route


def total_route_distance(
    source_node_id: int,
    ordered_destination_node_ids: list[int],
    distance_matrix: list[list[int]],
) -> int:
    """Returns total driving distance in meters for a source -> [destinations] route."""
    if not ordered_destination_node_ids:
        return 0

    stops = [source_node_id] + ordered_destination_node_ids
    return sum(
        distance_matrix[stops[i]][stops[i + 1]] for i in range(len(stops) - 1)
    )


def two_opt_improve(
    source_node_id: int,
    route: list[int],
    distance_matrix: list[list[int]],
) -> list[int]:
    """
    Improves a route using 2-opt local search.

    Repeatedly reverses sub-segments of the route when doing so reduces total
    distance. Continues until no improving swap exists (local optimum).

    Works on top of any initial route (e.g. nearest-neighbor output).
    Returns a new list — does not mutate the input.
    """
    if len(route) < 3:
        return list(route)

    best = list(route)
    best_dist = total_route_distance(source_node_id, best, distance_matrix)
    improved = True

    while improved:
        improved = False
        for i in range(len(best) - 1):
            for j in range(i + 2, len(best)):
                # Reverse the segment between i+1 and j (inclusive)
                candidate = best[: i + 1] + best[i + 1 : j + 1][::-1] + best[j + 1 :]
                dist = total_route_distance(source_node_id, candidate, distance_matrix)
                if dist < best_dist:
                    best = candidate
                    best_dist = dist
                    improved = True

    return best
