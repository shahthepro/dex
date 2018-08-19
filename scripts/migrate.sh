#!/bin/sh
migrate -path ./migrations -database "$CDEX_DB_CONNECTION_STRING" "$@"