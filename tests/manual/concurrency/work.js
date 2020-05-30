const sqlite3FilePath = './tests/manual/concurrency/db.sqlite3';
const VerySimpleQueue = require('../../../src/VerySimpleQueue');

const queue = new VerySimpleQueue({
  driver: 'sqlite3',
  filePath: sqlite3FilePath,
});

const handleJobs = async (worker) => {
  while (true) {
    await queue.handleJob(async (payload) => {
      console.log(worker, payload.number);
    });
  }
};

process.argv.splice(2).forEach(async (workerName) => {
  (async () => {
    await handleJobs(workerName);
  })();
});
