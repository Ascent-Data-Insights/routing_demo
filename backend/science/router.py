"""
Greedy nearest-neighbor router.

Given a source node and a list of destination node IDs, returns a visit order
that minimises total distance using a nearest-neighbor heuristic: always travel
to the closest unvisited destination next.
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
