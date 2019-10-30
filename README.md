# Snacker-Tracker Reporter

This repo contains the server-side components of Snacker-Tracker. It's a Swagger
managed REST API which exposes the endpoints to drive the scanner and UI components.

The API is documented in `src/swagger.yml`


# Getting Started

## Running Locally

`./auto/serve` will spin up the service using `docker-compose`, after having installed dependencies.

`./auto/db-migrate` will apply the latest migrations to the database.

`./auto/yarn` lets you run arbitrary yarn commands as you would on your own machine, but in the docker context.

`./auto/lint` runs `yarn lint` / `eslint`

## Adding an endpoint

Swagger is authoritative. It validates requests coming in, and responses going out. It's recommended you write the Swagger first, then implement your endpoint.

To do so, add a class in `./src/operations` which should at a minimum extend the `Operation` class, which responds an `HTTPResponse` object. Take a look at [operation_to_handler](./src/lib/operation_to_handler.js) to see what kind of magic happens behind the scenes.

`Operation` classes are meant to ressemble commands (as in the [Command pattern](https://en.wikipedia.org/wiki/Command_pattern))

Dependencies are injected at construction time (every request); for example: `this.services.logger.info(MESSAGE)`

These were meant to resemble commands (as in the Command pattern). Dependencies get injected at construction time.

Write operations should also emit an event into the stream.
