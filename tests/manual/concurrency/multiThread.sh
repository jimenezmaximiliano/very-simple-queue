#!/usr/bin/env bash

touch ./tests/manual/concurrency/db.sqlite3
docker run --rm -it -v $(pwd):/app -w /app node:14 node --trace-warnings ./tests/manual/concurrency/createJobs.js
docker run -d --rm -it -v $(pwd):/app -w /app node:14 node --trace-warnings ./tests/manual/concurrency/work.js workerA
docker run -d --rm -it -v $(pwd):/app -w /app node:14 node --trace-warnings ./tests/manual/concurrency/work.js workerB
docker run -d --rm -it -v $(pwd):/app -w /app node:14 node --trace-warnings ./tests/manual/concurrency/work.js workerC
docker run -d --rm -it -v $(pwd):/app -w /app node:14 node --trace-warnings ./tests/manual/concurrency/work.js workerD
docker run -d --rm -it -v $(pwd):/app -w /app node:14 node --trace-warnings ./tests/manual/concurrency/work.js workerE
docker run -d --rm -it -v $(pwd):/app -w /app node:14 node --trace-warnings ./tests/manual/concurrency/work.js workerF
