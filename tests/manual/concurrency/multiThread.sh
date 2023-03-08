#!/usr/bin/env bash

if [[ "$1" == "redis" ]]; then
    docker run -d -p 6379:6379 redis
fi

if [[ "$1" == "mysql" ]]; then
    docker run -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_ROOT_HOST='%' -d mysql/mysql-server
    sleep 20
fi

if [[ "$1" == "sqlite3" ]]; then
  touch ./tests/manual/concurrency/db.sqlite3
fi

node --trace-warnings ./tests/manual/concurrency/createJobs.js $1
node --trace-warnings ./tests/manual/concurrency/work.js $1 workerA &
node --trace-warnings ./tests/manual/concurrency/work.js $1 workerB &
node --trace-warnings ./tests/manual/concurrency/work.js $1 workerC &
node --trace-warnings ./tests/manual/concurrency/work.js $1 workerC &
node --trace-warnings ./tests/manual/concurrency/work.js $1 workerD &
node --trace-warnings ./tests/manual/concurrency/work.js $1 workerE &
node --trace-warnings ./tests/manual/concurrency/work.js $1 workerF &
node --trace-warnings ./tests/manual/concurrency/work.js $1 workerG &
