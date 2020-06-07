const VerySimpleQueue = require('../../../src/VerySimpleQueue');

const driver = process.argv[2];

let settings = {};

if (driver === 'sqlite3') {
  const sqlite3FilePath = './tests/manual/concurrency/db.sqlite3';
  settings = { filePath: sqlite3FilePath };
}

const queue = new VerySimpleQueue(driver, settings);

const createJobs = async () => {
  await queue.createJobsDbStructure();

  for (let i = 0; i < 1000; i += 1) {
    await queue.pushJob({ number: i });

    console.log(`Pushed job ${i}`);
  }

  await queue.closeConnection();
};


(async () => {
  await createJobs();
})();
