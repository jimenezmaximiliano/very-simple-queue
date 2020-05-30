
const sqlite3FilePath = './tests/manual/concurrency/db.sqlite3';

const VerySimpleQueue = require('../../../src/VerySimpleQueue');


const queue = new VerySimpleQueue({
  driver: 'sqlite3',
  filePath: sqlite3FilePath,
});

const createJobs = async () => {
  await queue.createJobsDbStructure();

  for (let i = 0; i < 1000; i += 1) {
    await queue.pushJob({ number: i });

    console.log(`Pushed job ${i}`);
  }
};


(async () => {
  await createJobs();
})();
