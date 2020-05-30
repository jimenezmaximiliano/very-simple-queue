#!/usr/bin/env bash

touch ./tests/manual/concurrency/db.sqlite3
node --trace-warnings ./tests/manual/concurrency/createJobs.js
node --trace-warnings ./tests/manual/concurrency/work.js workerA workerB workerC workerD
