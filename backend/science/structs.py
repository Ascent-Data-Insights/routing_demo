from dataclasses import dataclass, field
from typing import Literal


@dataclass
class Container:
    container_id: str
    source_id: str
    destination_id: str
    size: int
    temperature: Literal["AM", "RE"]


@dataclass
class TruckSize:
    AM: int
    RE: int


@dataclass
class Truck:
    id: str
    source_id: str
    truck_size: TruckSize
    containers: list[Container] = field(default_factory=list)

    @property
    def am_used(self) -> int:
        return sum(c.size for c in self.containers if c.temperature == "AM")

    @property
    def re_used(self) -> int:
        return sum(c.size for c in self.containers if c.temperature == "RE")

    @property
    def am_remaining(self) -> int:
        return self.truck_size.AM - self.am_used

    @property
    def re_remaining(self) -> int:
        return self.truck_size.RE - self.re_used

    @property
    def destination_ids(self) -> list[str]:
        return list(dict.fromkeys(c.destination_id for c in self.containers))

    def can_fit(self, container: Container) -> bool:
        if container.temperature == "AM":
            return self.am_remaining >= container.size
        return self.re_remaining >= container.size

    def add(self, container: Container) -> None:
        self.containers.append(container)
