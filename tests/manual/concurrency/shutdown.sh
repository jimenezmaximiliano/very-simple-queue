#!/usr/bin/env bash

touch ./tests/manual/concurrency/db.sqlite3

node --trace-warnings ./tests/manual/concurrency/createJobs.js sqlite3
node --trace-warnings ./tests/manual/concurrency/workWithShutdown.js sqlite3 workerA workerB workerC workerD
