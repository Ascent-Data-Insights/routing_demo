# Routing Optimization Demo

This repo contains a tech demo a potential routing optimization use case. The goal is to have a demo where the user can see a visualization of some number of trucks contianing some number of containers leave from some source locations and visit some destinations to minimize overall drive distance.

Core Concepts: 

* A "source" is a distribution center that is where all trucks leave from. Sources have a lat and long location.
* Destinations are warehouses where trucks must deliver containers too. Destinations have a lot and long location.
* Containers are the individual items that must be delivered. Each container has a source ID that it starts at and a destination id that it ends at. It also has a size (integer) and temperature (ambient AM or refrigerated RE) that will effect how it can be assigned to trucks.
* Trucks carry the containers from a source to a destination. All trucks are the same, and have some specified space for ambient containers and some specified space for refrigerated containers. There are an infinite number of potential trucks. 

## Architecture

The frontend will be a React application.

The backend will be a FastAPI application.

## Core Routing Endpoint

When the frontend requests an optimization to be run - it will be specified in this format:

```json
{
 "sources":[{"lat": "STR", "lon": "STR", "id": "STR"}],
 "destinations":[{"lat": "STR", "lon": "STR", "id": "STR"}],
 "containers":[{"container_id": "STR", "destination_id": "STR", "source_id": "STR", "size": "INT", "temperature": "<AM|RE>"}],
 "truck_size": {"AM": "INT", "RE": "INT"}
}

```

The response will be returned in this format:
```json
{
 "trucks":
 [
    {"id": "STR", "source_id": "STR", "destination_ids": ["STR", "STR"], "container_ids": ["STR", "STR"]}
 ]
}
```

## Possible Locations Endpoint

For simplicity sake - the backend will generate some number of potential source locations and destination locations and precompute a distance matrix between all locations to each other. As a result - the backend will expose an endpoint to tell the frontend what the candidate locations are. The frontend will then be able to randomly select from this list to generate valid source locations and destination locations that the backend expects. 
