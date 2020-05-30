const test = require('tape');
const sqlite3 = require('sqlite3');
const util = require('util');
const fs = require('fs');
const uuidGenerator = require('uuid').v4;
const SqlDriver = require('../../src/drivers/Sqlite3Driver');
const QueueClient = require('../../src/QueueClient');
const getCurrentTimestamp = require('../../src/helpers/getCurrentTimestamp');

const sqlite3FilePath = './tests/integration/temp/testdb.sqlite3';
fs.closeSync(fs.openSync(sqlite3FilePath, 'w'));

const drivers = [
  {
    name: 'Sqlite3 driver',
    resetAndGetInstance: () => {
      const instance = new SqlDriver(util.promisify, getCurrentTimestamp, sqlite3, sqlite3FilePath);
      instance.deleteAllJobs();

      return instance;
    },
    cleanUp: () => fs.unlinkSync(sqlite3FilePath),
  },
];

test.onFinish(() => {
  drivers.forEach((driver) => driver.cleanUp());
});

drivers.forEach((driver) => {
  test(`[${driver.name}] push a job and handle it`, async (assert) => {
    const driverInstance = driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    const jobUuid = await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.handleJob((payload) => assert.equal(payload.name, 'Obladi'));

    assert.equal(typeof jobUuid === 'string', true);
  });

  test(`[${driver.name}] job is deleted after being handled`, async (assert) => {
    const driverInstance = driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.handleJob((payload) => assert.equal(payload.name, 'Obladi'));
    await queueClient.handleJob((job) => assert.equal(job, null));
  });

  test(`[${driver.name}] the handler is not called when there aren't any jobs available`, async (assert) => {
    const driverInstance = driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    await queueClient.handleJob(() => assert.fail('Job handler called'));

    assert.pass('Job handler not called');
  });

  test(`[${driver.name}] you get the return value of the job handler`, async (assert) => {
    const driverInstance = driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    await queueClient.pushJob({ obladi: 'oblada' });
    const result = await queueClient.handleJob((payload) => ({ obladi: 'oblada' }));

    assert.equals(result.obladi, 'oblada');
  });

  test(`[${driver.name}] failed job is marked as failed and can be handled`, async (assert) => {
    const driverInstance = driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.handleJob(() => { throw 'Job failed'; });
    assert.plan(1);
    await queueClient.handleFailedJob((payload) => assert.equal(payload.name, 'Obladi'));
  });

  test(`[${driver.name}] handle job by uuid`, async (assert) => {
    const driverInstance = driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    const jobUuid = await queueClient.pushJob({ do: 'something' });
    const result = await queueClient.handleJobByUuid(() => ({ obladi: 'oblada' }), jobUuid);

    assert.equals(result.obladi, 'oblada');
  });
});
