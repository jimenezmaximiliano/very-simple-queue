# Very Simple Queue
![CI](https://github.com/jimenezmaximiliano/very-simple-queue/workflows/CI/badge.svg?branch=master)

Very Simple Queue is a job queue with a simple API and support for:

- redis
- mysql
- sqlite3
- Additional drivers on the way

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

#### Custom workers

You can create custom workers using the provided functions to handle jobs. You only need a loop. Check out
the API reference for more information.

## API Reference

<a name="VerySimpleQueue"></a>

### VerySimpleQueue
**Kind**: global class

* [VerySimpleQueue](#VerySimpleQueue)
    * [new VerySimpleQueue(driverName, driverConfig)](#new_VerySimpleQueue_new)
    * [.createJobsDbStructure()](#VerySimpleQueue+createJobsDbStructure) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.pushJob(payload, [queue])](#VerySimpleQueue+pushJob) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.handleJob(jobHandler, [queue], [throwErrorOnFailure])](#VerySimpleQueue+handleJob) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.handleJobByUuid(jobHandler, jobUuid, [throwErrorOnFailure])](#VerySimpleQueue+handleJobByUuid) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.handleFailedJob(jobHandler, [queue], [throwErrorOnFailure])](#VerySimpleQueue+handleFailedJob) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.closeConnection()](#VerySimpleQueue+closeConnection) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.work(jobHandler, settings)](#VerySimpleQueue+work) ⇒ <code>Promise.&lt;void&gt;</code>


* * *

<a name="new_VerySimpleQueue_new"></a>

#### new VerySimpleQueue(driverName, driverConfig)
VerySimpleQueue client constructor


| Param | Type | Description |
| --- | --- | --- |
| driverName | <code>string</code> | 'sqlite3' or 'redis' |
| driverConfig | [<code>Sqlite3DriverConfig</code>](#module_types.Sqlite3DriverConfig) \| <code>Object</code> | Driver specific configuration. For redis see https://github.com/NodeRedis/node-redis#options-object-properties . For mysql see https://github.com/mysqljs/mysql#connection-options . |

**Example** *(Sqlite3 driver)*
```js
new VerySimpleQueue('sqlite3', { filePath: '/tmp/db.sqlite3' });
```
**Example** *(Redis driver)*
```js
new VerySimpleQueue('redis', {}); // Options: https://github.com/NodeRedis/node-redis#options-object-properties
```
**Example** *(MySQL driver)*
```js
new VerySimpleQueue('mysql', {
     host: 'localhost',
     user: 'root',
     password: 'root',
     database: 'queue',
   }); // Options: https://github.com/mysqljs/mysql#connection-options
```

* * *

<a name="VerySimpleQueue+createJobsDbStructure"></a>

#### verySimpleQueue.createJobsDbStructure() ⇒ <code>Promise.&lt;void&gt;</code>
Creates the jobs table for SQL drivers and does nothing for redis

**Kind**: instance method of [<code>VerySimpleQueue</code>](#VerySimpleQueue)

* * *

<a name="VerySimpleQueue+pushJob"></a>

#### verySimpleQueue.pushJob(payload, [queue]) ⇒ <code>Promise.&lt;string&gt;</code>
Push a new job to a queue

**Kind**: instance method of [<code>VerySimpleQueue</code>](#VerySimpleQueue)
**Returns**: <code>Promise.&lt;string&gt;</code> - - A promise of the created job's uuid

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| payload | <code>Object</code> |  | This the object that the handler is going to get when you try to handle the job |
| [queue] | <code>string</code> | <code>&quot;default&quot;</code> | Queue name |

**Example**
```js
const jobUuid = verySimpleQueue.pushJob({ sendEmailTo: 'foo@foo.com' }, 'emails-to-send');
```

* * *

<a name="VerySimpleQueue+handleJob"></a>

#### verySimpleQueue.handleJob(jobHandler, [queue], [throwErrorOnFailure]) ⇒ <code>Promise.&lt;\*&gt;</code>
Handle one job on the given queue
The job get's deleted if it doesn't fail and is marked a failed if it does

**Kind**: instance method of [<code>VerySimpleQueue</code>](#VerySimpleQueue)
**Returns**: <code>Promise.&lt;\*&gt;</code> - - A promise of what the jobHandler returns

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| jobHandler | [<code>JobHandler</code>](#module_types.JobHandler) |  | Function that will receive the payload and handle the job |
| [queue] | <code>string</code> | <code>&quot;default&quot;</code> | The queue from which to take the job |
| [throwErrorOnFailure] | <code>boolean</code> | <code>false</code> | If a job fails, mark it failed and then throw an error |

**Example**
```js
verySimpleQueue.handleJob((payload) => sendEmail(payload.email), 'emails-to-send');
```

* * *

<a name="VerySimpleQueue+handleJobByUuid"></a>

#### verySimpleQueue.handleJobByUuid(jobHandler, jobUuid, [throwErrorOnFailure]) ⇒ <code>Promise.&lt;\*&gt;</code>
Handle a job by uuid
Same as handleJob but here you know which job you want to handle

**Kind**: instance method of [<code>VerySimpleQueue</code>](#VerySimpleQueue)
**Returns**: <code>Promise.&lt;\*&gt;</code> - - A promise of what the jobHandler returns

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| jobHandler | [<code>JobHandler</code>](#module_types.JobHandler) |  | Function that will receive the payload and handle the job |
| jobUuid | <code>string</code> |  | The job uuid that you've got when you pushed the job |
| [throwErrorOnFailure] | <code>boolean</code> | <code>false</code> | If a job fails, mark it failed and then throw an error |

**Example**
```js
verySimpleQueue.handleJobByUuid(
 (payload) => sendEmail(payload.email),
 'd5dfb2d6-b845-4e04-b669-7913bfcb2600'
);
```

* * *

<a name="VerySimpleQueue+handleFailedJob"></a>

#### verySimpleQueue.handleFailedJob(jobHandler, [queue], [throwErrorOnFailure]) ⇒ <code>Promise.&lt;\*&gt;</code>
Handle a job that failed on a given queue

**Kind**: instance method of [<code>VerySimpleQueue</code>](#VerySimpleQueue)
**Returns**: <code>Promise.&lt;\*&gt;</code> - - A promise of what the jobHandler returns

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| jobHandler | [<code>JobHandler</code>](#module_types.JobHandler) |  | Function that will receive the payload and handle the job |
| [queue] | <code>string</code> | <code>&quot;default&quot;</code> | The queue from which to take the failed job |
| [throwErrorOnFailure] | <code>boolean</code> | <code>false</code> | If a job fails, mark it failed and then throw an error |

**Example**
```js
verySimpleQueue.handleFailedJob((payload) => tryAgain(payload.email), 'emails-to-send');
```

* * *

<a name="VerySimpleQueue+closeConnection"></a>

#### verySimpleQueue.closeConnection() ⇒ <code>Promise.&lt;void&gt;</code>
Closes the connection to the database

**Kind**: instance method of [<code>VerySimpleQueue</code>](#VerySimpleQueue)

* * *

<a name="VerySimpleQueue+work"></a>

#### verySimpleQueue.work(jobHandler, settings) ⇒ <code>Promise.&lt;void&gt;</code>
Worker function to continuously handle jobs on a queue

**Kind**: instance method of [<code>VerySimpleQueue</code>](#VerySimpleQueue)

| Param | Type |
| --- | --- |
| jobHandler | [<code>JobHandler</code>](#module_types.JobHandler) |
| settings | [<code>WorkerSettings</code>](#module_types.WorkerSettings) |

**Example**
```js
verySimpleQueue.work(
 (payload) => sendEmail(payload.email),
 { queue: 'email-to-send' }
);
```

* * *

<a name="module_types"></a>

### types

* [types](#module_types)
    * [.JobHandler(payload)](#module_types.JobHandler)
    * [.Sqlite3DriverConfig](#module_types.Sqlite3DriverConfig) : <code>Object</code>
    * [.WorkerSettings](#module_types.WorkerSettings) : <code>Object</code>


* * *

<a name="module_types.JobHandler"></a>

#### types.JobHandler(payload)
**Kind**: static method of [<code>types</code>](#module_types)

| Param | Type |
| --- | --- |
| payload | <code>Object</code> |


* * *

<a name="module_types.Sqlite3DriverConfig"></a>

#### types.Sqlite3DriverConfig : <code>Object</code>
Sqlite3DriverConfig

**Kind**: static typedef of [<code>types</code>](#module_types)
**Properties**

| Name | Type |
| --- | --- |
| filePath | <code>string</code> |


* * *

<a name="module_types.WorkerSettings"></a>

#### types.WorkerSettings : <code>Object</code>
WorkerSettings

**Kind**: static typedef of [<code>types</code>](#module_types)
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [queue] | <code>string</code> | <code>&quot;default&quot;</code> | The queue to work on |
| [restTimeInSeconds] | <code>Number</code> | <code>5</code> | Time to wait after attempting to handle a job whether successful or not |
| [limit] | <code>Number</code> \| <code>null</code> | <code></code> | Max number of jobs to be handled |
| [logResults] | <code>boolean</code> | <code>false</code> | console.log the return value of the handler function |
| [logErrors] | <code>boolean</code> | <code>false</code> | console.log errors for failed jobs |
| [stopOnFailure] | <code>boolean</code> | <code>false</code> | Stop the worker if a job fails |
| [logger] | <code>function</code> | <code>console.log</code> | Function used to log. Defaults to console.log |


* * *


## License

[ISC](LICENSE.md)
