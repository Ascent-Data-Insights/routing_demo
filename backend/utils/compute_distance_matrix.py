import os
import json
import googlemaps

API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
gmaps = googlemaps.Client(key=API_KEY)

# Read in lat/lon locations from config.jsonc
with open('config.jsonc', 'r') as f:
    config = json.load(f)

# Build parallel lists: node IDs (0..N-1), human-readable names, and coords
location_names = [list(l.keys())[0] for l in config['locations']]
location_coords = [list(l.values())[0] for l in config['locations']]
node_ids = list(range(len(location_names)))

# id -> name lookup for use by other code
id_to_name = {i: name for i, name in enumerate(location_names)}


BATCH_SIZE = 10  # max 100 elements per request (10x10)

def get_distance_matrix_batched(coords):
    n = len(coords)
    distance_matrix = [[0] * n for _ in range(n)]
    duration_matrix = [[0] * n for _ in range(n)]

    origin_batches = [coords[i:i+BATCH_SIZE] for i in range(0, n, BATCH_SIZE)]
    dest_batches = [coords[j:j+BATCH_SIZE] for j in range(0, n, BATCH_SIZE)]

    for oi, origin_batch in enumerate(origin_batches):
        for di, dest_batch in enumerate(dest_batches):
            result = gmaps.distance_matrix(
                origins=origin_batch,
                destinations=dest_batch,
                mode="driving",
                units="metric"
            )
            row_offset = oi * BATCH_SIZE
            col_offset = di * BATCH_SIZE
            for i, row in enumerate(result['rows']):
                for j, element in enumerate(row['elements']):
                    distance_matrix[row_offset + i][col_offset + j] = element['distance']['value']
                    duration_matrix[row_offset + i][col_offset + j] = element['duration']['value']

    return distance_matrix, duration_matrix


# NxN matrix of meters (int), indexed by node ID
n = len(node_ids)
distance_matrix, duration_matrix = get_distance_matrix_batched(location_coords)

output = {
    "id_to_name": id_to_name,
    "distance_matrix": distance_matrix,
    "duration_matrix": duration_matrix,
}

with open('distance_matrix.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"Saved {n}x{n} distance matrix for {n} locations.")
