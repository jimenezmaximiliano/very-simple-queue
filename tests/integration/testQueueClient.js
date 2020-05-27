const test = require('tape');
const sqlite3 = require('sqlite3');
const util = require('util');
const uuidGenerator = require('uuid').v4;
const SqlDriver = require('../../src/drivers/Sqlite3Driver');
const QueueClient = require('../../src/QueueClient');
const getCurrentTimestamp = require('../../src/helpers/getCurrentTimestamp');

const drivers = [
  {
    name: 'Sqlite3 driver',
    instance: new SqlDriver(util.promisify, getCurrentTimestamp, sqlite3, ':memory:'),
    reset: () => this.instance = new SqlDriver(util.promisify, getCurrentTimestamp, sqlite3, ':memory:'),
  },
];

drivers.forEach((driver) => {
  test(`[${driver.name}] push a job and handle it`, async (assert) => {
    driver.reset();
    const queueClient = new QueueClient(driver.instance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    const jobUuid = await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.handleJob((payload) => assert.equal(payload.name, 'Obladi'));

    assert.equal(typeof jobUuid === 'string', true);
  });

  test(`[${driver.name}] job is deleted after being handled`, async (assert) => {
    driver.reset();
    const queueClient = new QueueClient(driver.instance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.handleJob((payload) => assert.equal(payload.name, 'Obladi'));
    await queueClient.handleJob((job) => assert.equal(job, null));
  });

  test(`[${driver.name}] the handler is not called when there aren't any jobs available`, async (assert) => {
    driver.reset();
    const queueClient = new QueueClient(driver.instance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    await queueClient.handleJob(() => assert.fail('Job handler called'));

    assert.pass('Job handler not called');
  });

  test(`[${driver.name}] you get the return value of the job handler`, async (assert) => {
    driver.reset();
    const queueClient = new QueueClient(driver.instance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    await queueClient.pushJob({ do: 'something' });
    const result = await queueClient.handleJob(() => ({ obladi: 'oblada' }));

    assert.equals(result.obladi, 'oblada');
  });

  test(`[${driver.name}] failed job is marked as failed and can be handled`, async (assert) => {
    driver.reset();
    const queueClient = new QueueClient(driver.instance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    await queueClient.pushJob({ name: 'Obladi' });
    await queueClient.handleJob(() => { throw 'Job failed'; });
    assert.plan(1);
    await queueClient.handleFailedJob((payload) => assert.equal(payload.name, 'Obladi'));
  });

  test(`[${driver.name}] handle job by uuid`, async (assert) => {
    driver.reset();
    const queueClient = new QueueClient(driver.instance, uuidGenerator, getCurrentTimestamp);
    await queueClient.createJobsDbStructure();
    const jobUuid = await queueClient.pushJob({ do: 'something' });
    const result = await queueClient.handleJobByUuid(() => ({ obladi: 'oblada' }), jobUuid);

    assert.equals(result.obladi, 'oblada');
  });
});
