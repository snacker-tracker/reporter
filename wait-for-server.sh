#!/usr/bin/env bash

until $(curl --output /dev/null --silent --fail $1); do
    printf '.'
    sleep 5
done
