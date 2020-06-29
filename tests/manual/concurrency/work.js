const VerySimpleQueue = require('../../../src/VerySimpleQueue');

const driver = process.argv[2];

let settings = {};

if (driver === 'sqlite3') {
  const sqlite3FilePath = './tests/manual/concurrency/db.sqlite3';
  settings = { filePath: sqlite3FilePath };
}

if (driver === 'mysql') {
  settings = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'jobs',
  };
}

const queue = new VerySimpleQueue(driver, settings);

process.argv.splice(3).forEach(async (workerName) => {
  await (async () => {
    const handler = async (payload) => `${workerName}: ${payload.number}`;

    await queue.work(handler, {
      stopOnFailure: true,
      logErrors: true,
      restTimeInSeconds: 0,
      logResults: true,
    });
  })();
});
