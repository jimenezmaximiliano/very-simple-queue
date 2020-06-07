const VerySimpleQueue = require('../../../src/VerySimpleQueue');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const driver = process.argv[2];

let settings = {};

if (driver === 'sqlite3') {
  const sqlite3FilePath = './tests/manual/concurrency/db.sqlite3';
  settings = { filePath: sqlite3FilePath };
}

const queue = new VerySimpleQueue(driver, settings);

const handleJobs = async (worker) => {
  while (true) {
    const result = await queue.handleJob(async (payload) => {
      console.log(worker, payload.number);
      return 1;
    });

    if (!result) {
      break;
    }
  }
};

process.argv.splice(3).forEach(async (workerName) => {
  (async () => {
    await handleJobs(workerName);
  })();
});
