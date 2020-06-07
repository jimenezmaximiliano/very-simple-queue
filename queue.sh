#!/usr/bin/env bash

set -e

function run_redis_db() {
  docker run -d -p 6379:6379 redis
}

case "$1" in
run_redis_db)
    run_redis_db
    ;;
*)
    echo "Available commands: run_redis_db"
    ;;
esac
