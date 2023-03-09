# Very Simple Queue
![CI](https://github.com/jimenezmaximiliano/very-simple-queue/workflows/CI/badge.svg?branch=master)

Very Simple Queue is a job queue with a simple API and support for:

- redis
- mysql
- sqlite3

## Installation

```bash
npm install very-simple-queue
```

or

```bash
yarn add very-simple-queue
```

## Usage

### Instantiating the VerySimpleQueue facade

```javascript
const VerySimpleQueue = require('very-simple-queue');

const verySimpleQueue = new VerySimpleQueue('sqlite3', {
  filePath: '/tmp/testdb.sqlite3',
});

```

### Usage example

```javascript
await verySimpleQueue.createJobsDbStructure(); // Only the first time
await verySimpleQueue.pushJob({ obladi: "oblada" }, 'myQueue');
await verySimpleQueue.handleJob((payload) => console.log(payload), 'myQueue');
```

### Workers

#### Using the work function

```javascript
await verySimpleQueue.work((payload) => console.log(payload), { queue: 'myQueue' });
```

##### Default values for worker settings

```javascript
{
  queue: 'default',
  restTimeInSeconds: 5,
  logResults: false,
  limit: null, // Number of jobs to handle before stopping
  logErrors: false,
  stopOnFailure: false,
  loggerFunction: console.log,
}
```

##### Graceful shutdown

After getting a signal to shut down your application, you can stop workers to grab another job like this:

```javascript
verySimpleQueue.shutdown();
```

Existing jobs will be finished.

### Other functions

#### Handle job by UUID

```javascript
await verySimpleQueue.handleJobByUuid((payload) => console.log(payload), 'myQueue', 'uuid');
```

#### Custom workers

You can create custom workers using the provided functions to handle jobs. You only need a loop.

## License

[ISC](LICENSE.md)
