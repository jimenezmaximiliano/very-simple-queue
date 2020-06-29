const test = require('tape');
const testdouble = require('testdouble');

const Worker = require('../../src/Worker');
const QueueClient = require('../../src/QueueClient');

test('Job handler is executed when there is a job available', async (assert) => {
  const worker = new Worker();
  const queueClient = testdouble.object(QueueClient.prototype);
  const handler = () => {};
  const throwOnError = true;
  const jobResult = { result: 1 };
  const logs = [];

  testdouble.when(queueClient.handleJob(handler, 'default', throwOnError))
    .thenResolve(jobResult);

  const settings = {
    limit: 1,
    logResults: true,
    loggerFunction: (text) => logs.push(text),
  };

  await worker.work(queueClient, handler, settings);

  assert.equals(logs[0], `Result: ${JSON.stringify(jobResult)}`);
  assert.equals(logs[1], 'Job limit reached');
  assert.equals(logs.length, 2);

  testdouble.reset();
});

test('Errors are logged and it stops on failure', async (assert) => {
  const worker = new Worker();
  const queueClient = testdouble.object(QueueClient.prototype);
  const handler = () => {};
  const throwOnError = true;
  const logs = [];

  testdouble.when(queueClient.handleJob(handler, 'default', throwOnError))
    .thenReject(new Error('Something went wrong'));

  const settings = {
    limit: 1,
    logResults: true,
    logErrors: true,
    stopOnFailure: true,
    loggerFunction: (text) => logs.push(text),
  };

  await worker.work(queueClient, handler, settings);

  assert.equals(logs[0], `${JSON.stringify('Something went wrong')}`);
  assert.equals(logs.length, 1);
  testdouble.reset();
});
