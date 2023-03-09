const VerySimpleQueue = require('../../../src/VerySimpleQueue');

const sqlite3FilePath = './tests/manual/concurrency/db.sqlite3';

const queue = new VerySimpleQueue('sqlite3', { filePath: sqlite3FilePath });

setTimeout(() => queue.shutdown(), 1000)

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
