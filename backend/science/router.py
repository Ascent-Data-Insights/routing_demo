"""
Routing algorithms.

nearest_neighbor_route  — greedy heuristic (baseline)
two_opt_improve         — local-search improvement over any initial route
three_opt_improve       — stronger local-search improvement (subsumes 2-opt)
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

# Note: 3-opt is more powerful but can take a long time to run on complex routes so it is not 
# used by default.
def three_opt_improve(
    source_node_id: int,
    route: list[int],
    distance_matrix: list[list[int]],
) -> list[int]:
    """
    Improves a route using 3-opt local search.

    Considers all ways to remove 3 edges and reconnect the resulting segments.
    There are 8 reconnection schemes; 1 is the identity and 3 are pure 2-opt
    moves, leaving 4 genuinely new 3-opt reconnections tested here alongside
    the 2-opt ones for completeness.

    Distances are computed via segment-cost deltas to avoid redundant matrix
    lookups. Continues until no improving move exists (local optimum).
    Returns a new list — does not mutate the input.
    """
    if len(route) < 4:
        return two_opt_improve(source_node_id, route, distance_matrix)

    d = distance_matrix
    stops = [source_node_id] + list(route)  # index 0 is source, not revisited at end
    n = len(stops)

    def seg_d(a: int, b: int) -> int:
        return d[stops[a]][stops[b]]

    improved = True
    while improved:
        improved = False
        for i in range(n - 2):
            for j in range(i + 1, n - 1):
                for k in range(j + 1, n):
                    # Current edges: (i→i+1), (j→j+1), (k→k+1 or source if k==n-1)
                    # Segments: A = stops[0..i], B = stops[i+1..j], C = stops[j+1..k], D = stops[k+1..n-1]
                    # We compare reconnections by cost of the 3 removed/added edges only.
                    # Node indices at segment boundaries:
                    a, b = i, i + 1        # end of A, start of B
                    c, e = j, j + 1        # end of B, start of C  (using e to avoid clash with built-in)
                    f = k                  # end of C
                    g = (k + 1) % n        # start of D (wraps to 0 = source if k is last)

                    d0 = seg_d(a, b) + seg_d(c, e) + seg_d(f, g)

                    # All 7 non-identity reconnections (segments may be reversed):
                    # Notation: B' = reversed B, C' = reversed C
                    # 1. A + B' + C  + D  (2-opt on first pair)
                    d1 = seg_d(a, c) + seg_d(b, e) + seg_d(f, g)
                    # 2. A + B  + C' + D  (2-opt on second pair)
                    d2 = seg_d(a, b) + seg_d(c, f) + seg_d(e, g)
                    # 3. A + C  + B  + D  (swap B and C, no reversals — pure 3-opt)
                    d3 = seg_d(a, e) + seg_d(f, b) + seg_d(c, g)
                    # 4. A + C  + B' + D  (swap + reverse B)
                    d4 = seg_d(a, e) + seg_d(f, c) + seg_d(b, g)
                    # 5. A + C' + B  + D  (swap + reverse C)
                    d5 = seg_d(a, f) + seg_d(e, b) + seg_d(c, g)
                    # 6. A + C' + B' + D  (swap + reverse both)
                    d6 = seg_d(a, f) + seg_d(e, c) + seg_d(b, g)

                    best_delta = min(d1, d2, d3, d4, d5, d6)
                    if best_delta >= d0:
                        continue

                    # Reconstruct the improving route
                    A = stops[:b]           # stops[0..i] inclusive
                    B = stops[b:e]          # stops[i+1..j] inclusive
                    C = stops[e:g] if g > 0 else stops[e:]  # stops[j+1..k] inclusive
                    D = stops[g:] if g > 0 else []

                    if best_delta == d1:
                        new_stops = A + B[::-1] + C + D
                    elif best_delta == d2:
                        new_stops = A + B + C[::-1] + D
                    elif best_delta == d3:
                        new_stops = A + C + B + D
                    elif best_delta == d4:
                        new_stops = A + C + B[::-1] + D
                    elif best_delta == d5:
                        new_stops = A + C[::-1] + B + D
                    else:  # d6
                        new_stops = A + C[::-1] + B[::-1] + D

                    stops = new_stops
                    improved = True

    return stops[1:]  # strip the source back off
