const mysql = require('mysql2/promise');
const VerySimpleQueue = require('../../../src/VerySimpleQueue');

const driver = process.argv[2];

(async () => {
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
    };

    const connection = await mysql.createConnection(settings);
    await connection.query('CREATE DATABASE jobs');
    settings.database = 'jobs';
    await connection.end();
  }

  const queue = new VerySimpleQueue(driver, settings);

  /**
   * Create jobs
   */
  await queue.createJobsDbStructure();

  for (let i = 0; i < 1000; i += 1) {
    await queue.pushJob({ number: i });

    console.log(`Pushed job ${i}`);
  }

  await queue.closeConnection();
})();
