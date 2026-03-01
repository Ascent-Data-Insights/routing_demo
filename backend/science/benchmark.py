"""
Algorithm benchmark.

Compares the greedy baseline against Clarke-Wright + 2-opt across multiple
synthetic scenarios of varying size and density.

Run with:
    cd backend && .venv/bin/python -m science.benchmark
"""

import json
import random
from dataclasses import dataclass
from pathlib import Path

from science.structs import Container, TruckSize
from science.batcher import batch_containers, savings_batch_containers, RoutedTruck

DATA_DIR = Path(__file__).parent.parent / "data"


def load_matrix():
    with open(DATA_DIR / "distance_matrix.json") as f:
        d = json.load(f)
    return d["distance_matrix"], d["duration_matrix"], d["id_to_name"]


@dataclass
class ScenarioResult:
    scenario: str
    num_containers: int
    # Greedy baseline
    greedy_trucks: int
    greedy_distance_km: float
    # Clarke-Wright + 2-opt
    savings_trucks: int
    savings_distance_km: float

    @property
    def distance_saving_pct(self) -> float:
        if self.greedy_distance_km == 0:
            return 0.0
        return 100 * (self.greedy_distance_km - self.savings_distance_km) / self.greedy_distance_km

    @property
    def truck_saving(self) -> int:
        return self.greedy_trucks - self.savings_trucks


def run_scenario(
    name: str,
    containers: list[Container],
    source_node_ids: dict[str, int],
    destination_node_ids: dict[str, int],
    truck_size: TruckSize,
    dist: list[list[int]],
    dur: list[list[int]],
) -> ScenarioResult:
    def total_km(trucks: list[RoutedTruck]) -> float:
        return sum(t.route_distance_meters for t in trucks) / 1000

    greedy = batch_containers(containers, source_node_ids, destination_node_ids, truck_size, dist, dur)
    savings = savings_batch_containers(containers, source_node_ids, destination_node_ids, truck_size, dist, dur)

    return ScenarioResult(
        scenario=name,
        num_containers=len(containers),
        greedy_trucks=len(greedy),
        greedy_distance_km=total_km(greedy),
        savings_trucks=len(savings),
        savings_distance_km=total_km(savings),
    )


def make_containers(
    rng: random.Random,
    src_ids: list[str],
    dst_ids: list[str],
    n: int,
    am_fraction: float = 0.6,
) -> list[Container]:
    containers = []
    for k in range(n):
        src = rng.choice(src_ids)
        dst = rng.choice(dst_ids)
        temp = "AM" if rng.random() < am_fraction else "RE"
        size = rng.randint(1, 4)
        containers.append(Container(
            container_id=f"c-{k}",
            source_id=src,
            destination_id=dst,
            size=size,
            temperature=temp,
        ))
    return containers


def print_results(results: list[ScenarioResult]):
    col = [40, 6, 8, 8, 10, 10, 10, 8]
    header = ["Scenario", "Ctrs", "G.Trucks", "S.Trucks", "G.Dist km", "S.Dist km", "Dist save", "Trucks"]
    sep = "  ".join("-" * w for w in col)

    def row(*vals):
        return "  ".join(str(v).ljust(w) for v, w in zip(vals, col))

    print()
    print(row(*header))
    print(sep)
    for r in results:
        print(row(
            r.scenario,
            r.num_containers,
            r.greedy_trucks,
            r.savings_trucks,
            f"{r.greedy_distance_km:.1f}",
            f"{r.savings_distance_km:.1f}",
            f"{r.distance_saving_pct:+.1f}%",
            f"{r.truck_saving:+d}",
        ))
    print(sep)
    avg_dist = sum(r.distance_saving_pct for r in results) / len(results)
    avg_trucks = sum(r.truck_saving for r in results) / len(results)
    print(row("AVERAGE", "", "", "", "", "", f"{avg_dist:+.1f}%", f"{avg_trucks:+.1f}"))
    print()


def main():
    dist, dur, id_to_name = load_matrix()
    n_nodes = len(id_to_name)

    # Use the first N nodes as sources, next M as destinations
    def node_ids(start: int, count: int, prefix: str) -> dict[str, int]:
        return {f"{prefix}-{i}": start + i for i in range(count)}

    results = []
    rng = random.Random(42)  # fixed seed for reproducibility

    scenarios = [
        # (name,                  n_src, n_dst, n_containers, am_frac, truck_AM, truck_RE)
        ("small: 1src 3dst 10c",       1,  3,  10, 0.6, 10,  6),
        ("small: 2src 5dst 20c",       2,  5,  20, 0.6, 10,  6),
        ("medium: 2src 8dst 40c",      2,  8,  40, 0.6, 10,  6),
        ("medium: 3src 8dst 50c",      3,  8,  50, 0.5, 12,  8),
        ("large: 4src 10dst 80c",      4, 10,  80, 0.6, 15, 10),
        ("large: 5src 10dst 100c",     5, 10, 100, 0.6, 15, 10),
        ("tight capacity: 2src 6dst",  2,  6,  40, 0.7,  6,  4),
        ("loose capacity: 2src 6dst",  2,  6,  40, 0.7, 20, 15),
        ("AM-heavy: 2src 6dst 40c",    2,  6,  40, 0.9, 12,  4),
        ("RE-heavy: 2src 6dst 40c",    2,  6,  40, 0.1,  4, 12),
    ]

    for name, n_src, n_dst, n_c, am_frac, truck_am, truck_re in scenarios:
        # Ensure we don't exceed the matrix size
        assert n_src + n_dst <= n_nodes, f"Too many nodes for scenario {name}"
        src_ids = node_ids(0, n_src, "src")
        dst_ids = node_ids(n_src, n_dst, "dst")
        containers = make_containers(rng, list(src_ids), list(dst_ids), n_c, am_frac)
        truck_size = TruckSize(AM=truck_am, RE=truck_re)
        results.append(run_scenario(name, containers, src_ids, dst_ids, truck_size, dist, dur))

    print_results(results)


if __name__ == "__main__":
    main()
