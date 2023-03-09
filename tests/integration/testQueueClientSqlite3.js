const test = require('tape');
const sqlite3 = require('sqlite3');
const util = require('util');
const fs = require('fs');
const uuidGenerator = require('uuid').v4;
const Sqlite3Driver = require('../../src/drivers/Sqlite3Driver');
const QueueClient = require('../../src/QueueClient');
const Worker = require('../../src/Worker');
const getCurrentTimestamp = require('../../src/helpers/getCurrentTimestamp');

const sqlite3FilePath = './tests/integration/temp/testdb.sqlite3';
fs.closeSync(fs.openSync(sqlite3FilePath, 'w'));

const drivers = [
  {
    name: 'Sqlite3 driver',
    resetAndGetInstance: async () => {
      const instance = new Sqlite3Driver(
        util.promisify,
        getCurrentTimestamp,
        sqlite3,
        { filePath: sqlite3FilePath },
      );
      await instance.createJobsDbStructure();
      await instance.deleteAllJobs();

      return instance;
    },
    cleanUp: async () => {
      fs.unlinkSync(sqlite3FilePath);
    },
  },
];

test.onFinish(() => {
  drivers.forEach(async (driver) => driver.cleanUp());
});

drivers.forEach(async (driver) => {
  test(`[${driver.name}] push a job and handle it`, async (assert) => {
    const driverInstance = await driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp, new Worker());
    const jobUuid = await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.handleJob((payload) =>
      assert.equal(payload.name, 'Obladi')
    );
    assert.equal(typeof jobUuid === 'string', true);
    assert.plan(2);
    await driverInstance.closeConnection();
  });

  test(`[${driver.name}] job is deleted after being handled`, async (assert) => {
    const driverInstance = await driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp, new Worker());
    await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.handleJob((payload) => assert.equal(payload.name, 'Obladi'));
    await queueClient.handleJob(() => assert.fail("it should not handle a null job"));
    await driverInstance.closeConnection();
    assert.plan(1);
  });

  test(`[${driver.name}] the handler is not called when there aren't any jobs available`, async (assert) => {
    const driverInstance = await driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp, new Worker());
    await queueClient.handleJob(() => assert.fail('Job handler called'));
    assert.pass('Job handler not called');
    assert.plan(1);
    await driverInstance.closeConnection();
  });

  test(`[${driver.name}] you get the return value of the job handler`, async (assert) => {
    const driverInstance = await driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp, new Worker());
    await queueClient.pushJob({ obladi: 'oblada' });
    const result = await queueClient.handleJob(() => ({ obladi: 'oblada' }));
    assert.equals(result.obladi, 'oblada');
    assert.plan(1);
    await driverInstance.closeConnection();
  });

  test(`[${driver.name}] failed job is marked as failed and can be handled`, async (assert) => {
    const driverInstance = await driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp, new Worker());
    await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.handleJob(() => { throw new Error('Job failed'); });
    assert.plan(1);
    await queueClient.handleFailedJob((payload) => assert.equal(payload.name, 'Obladi'));
    await driverInstance.closeConnection();
  });

  test(`[${driver.name}] failed job is marked as failed if it fails two times and can be handled`, async (assert) => {
    const driverInstance = await driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp, new Worker());
    await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.handleJob(() => { throw new Error('Job failed'); });
    assert.plan(2);
    await queueClient.handleFailedJob((payload) => {
      assert.equal(payload.name, 'Obladi');
      throw new Error('Another failure');
    });
    await queueClient.handleFailedJob((payload) => {
      assert.equal(payload.name, 'Obladi');
    });
    await driverInstance.closeConnection();
  });

  test(`[${driver.name}] handle job by uuid`, async (assert) => {
    const driverInstance = await driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp, new Worker());
    const jobUuid = await queueClient.pushJob({ do: 'something' });
    const result = await queueClient.handleJobByUuid(() => ({ obladi: 'oblada' }), jobUuid);
    assert.equals(result.obladi, 'oblada');
    assert.plan(1);
    await driverInstance.closeConnection();
  });

  test(`[${driver.name}] handle job when there aren't any jobs available doesn't fail`, async (assert) => {
    const driverInstance = await driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp, new Worker());
    const result = await queueClient.handleJob(() => ({ obladi: 'oblada' }));
    assert.equals(result, null);
    assert.plan(1);
    await driverInstance.closeConnection();
  });

  test(`[${driver.name}] work on queue until the last job is done`, async (assert) => {
    assert.plan(1);
    const driverInstance = await driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp, new Worker());
    await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.work((payload) => {
      assert.equal(payload.name, 'Obladi');
      throw new Error('Stop');
    }, {
      limit: 1,
    });
    await driverInstance.closeConnection();
  });

  test(`[${driver.name}] don't work on the queue if you get the shutdown signal`, async (assert) => {
    assert.plan(0);
    const driverInstance = await driver.resetAndGetInstance();
    const queueClient = new QueueClient(driverInstance, uuidGenerator, getCurrentTimestamp, new Worker());
    await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.pushJob({ name: 'Obladi' });
    queueClient.shutdown();
    await queueClient.work((payload) => {
      assert.equal(payload.name, 'Obladi');
    }, {});
    await driverInstance.closeConnection();
  });
});
