# Snacker-Tracker Reporter

This repo contains the server-side components of Snacker-Tracker. It's a Swagger
managed REST API which exposes the endpoints to drive the scanner and UI components.

The API is documented in `src/swagger.yml`

<a href="https://codeclimate.com/github/snacker-tracker/reporter/maintainability"><img src="https://api.codeclimate.com/v1/badges/653ebd9271d102bcb81c/maintainability" /></a> [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fsnacker-tracker%2Freporter%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/snacker-tracker/reporter/master)

# Getting Started

## Running Locally

`./auto/serve` will spin up the service using `docker-compose`, after having installed dependencies.

`./auto/db-migrate` will apply the latest migrations to the database.

`./auto/yarn` lets you run arbitrary yarn commands as you would on your own machine, but in the docker context.

`./auto/lint` runs `yarn lint` / `eslint`

## Architecture

### Classes

Most functionality is defined in classes, something some JS developpers might not like. Oh well.

All important classes are define in [src/lib/](./src/lib). Files with class definitions can import modules and other code, as far as those imports
are used simply (no configuration, swappable implementations, or are vital for testing). When swaping components, or complex configuration is required,
those are generally passed in at construction time.

### Handlers

Event handlers, both HTTP and Kinesis stream events, are in [src/handlers/http](./src/handlers/http/) and [src/handlers/stream](./src/handlers/stream/)

They losely follow the [Command pattern](https://en.wikipedia.org/wiki/Command_pattern)

### Services

All instantiations happen from [src/services](./src/services); where implementations can potentially be swapped, configuration altered, dependency trees managed.

## Adding an endpoint

Swagger is authoritative. It validates requests coming in, and responses going out. It's recommended you write the Swagger first, then implement your endpoint.

To do so, add a class in `./src/operations` which should at a minimum extend the `Operation` class, which responds an `HTTPResponse` object. Take a look at [operation_to_handler](./src/lib/operation_to_handler.js) to see what kind of magic happens behind the scenes.

Write operations should also emit an event into the stream.

BUMP
