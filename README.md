# Very Simple Queue
![CI](https://github.com/jimenezmaximiliano/very-simple-queue/workflows/CI/badge.svg?branch=master)

Very Simple Queue is a job queue with a simple API and support for sqlite3 (additional drivers on the way)

## Installation

```bash
npm install very-simple-queue
```

## Usage

### Instantiating the VerySimpleQueue facade

```javascript
const VerySimpleQueue = require('very-simple-queue');

const queue = new VerySimpleQueue('sqlite3', {
  filePath: '/tmp/testdb.sqlite3',
});

```

### Usage example

```javascript
await queue.createJobsDbStructure(); // Only the first time
await queue.pushJob({ name: "Maxi" }, 'myQueue');
await queue.handleJob((payload) => console.log(payload), 'myQueue');
```

## API Reference

### Modules

<dl>
<dt><a href="#module_JobHandler">JobHandler</a></dt>
<dd></dd>
</dl>

### Classes

<dl>
<dt><a href="#VerySimpleQueue">VerySimpleQueue</a></dt>
<dd></dd>
</dl>

### Functions

<dl>
<dt></dt>
<dd></dd>
</dl>

<a name="module_JobHandler"></a>

### JobHandler

* * *

<a name="exp_module_JobHandler--undefined"></a>

#### 
**Kind**: global method of [<code>JobHandler</code>](#module_JobHandler)  

| Param | Type |
| --- | --- |
| payload | <code>Object</code> | 


* * *

<a name="VerySimpleQueue"></a>

### VerySimpleQueue
**Kind**: global class  

* [VerySimpleQueue](#VerySimpleQueue)
    * [new VerySimpleQueue(driverName, driverConfig)](#new_VerySimpleQueue_new)
    * [.createJobsDbStructure()](#VerySimpleQueue+createJobsDbStructure) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.pushJob(payload, [queue])](#VerySimpleQueue+pushJob) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.handleJob(jobHandler, [queue])](#VerySimpleQueue+handleJob) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.handleJobByUuid(jobHandler, jobUuid)](#VerySimpleQueue+handleJobByUuid) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.handleFailedJob(jobHandler, [queue])](#VerySimpleQueue+handleFailedJob) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.closeConnection()](#VerySimpleQueue+closeConnection) ⇒ <code>Promise.&lt;void&gt;</code>


* * *

<a name="new_VerySimpleQueue_new"></a>

#### new VerySimpleQueue(driverName, driverConfig)
VerySimpleQueue client constructor


| Param | Type | Description |
| --- | --- | --- |
| driverName | <code>string</code> | 'sqlite3' or 'redis' |
| driverConfig | <code>Sqlite3DriverConfig</code> \| <code>Object</code> | Driver specific configuration For redis see https://github.com/NodeRedis/node-redis#options-object-properties |

**Example** *(Sqlite3 driver)*  
```js
new VerySimpleQueue('sqlite3', { filePath: '/tmp/db.sqlite3' });
```
**Example** *(Redis driver)*  
```js
new VerySimpleQueue('redis', {});
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

#### verySimpleQueue.handleJob(jobHandler, [queue]) ⇒ <code>Promise.&lt;\*&gt;</code>
Handle one job on the given queue
The job get's deleted if it doesn't fail and is marked a failed if it does

**Kind**: instance method of [<code>VerySimpleQueue</code>](#VerySimpleQueue)  
**Returns**: <code>Promise.&lt;\*&gt;</code> - - A promise of what the jobHandler returns  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| jobHandler | [<code>JobHandler</code>](#module_JobHandler) |  | Function that will receive the payload and handle the job |
| [queue] | <code>string</code> | <code>&quot;default&quot;</code> | The queue from which to take the job |

**Example**  
```js
verySimpleQueue.handleJob((payload) => sendEmail(payload.email), 'emails-to-send');
```

* * *

<a name="VerySimpleQueue+handleJobByUuid"></a>

#### verySimpleQueue.handleJobByUuid(jobHandler, jobUuid) ⇒ <code>Promise.&lt;\*&gt;</code>
Handle a job by uuid
Same as handleJob but here you know which job you want to handle

**Kind**: instance method of [<code>VerySimpleQueue</code>](#VerySimpleQueue)  
**Returns**: <code>Promise.&lt;\*&gt;</code> - - A promise of what the jobHandler returns  

| Param | Type | Description |
| --- | --- | --- |
| jobHandler | [<code>JobHandler</code>](#module_JobHandler) | Function that will receive the payload and handle the job |
| jobUuid | <code>string</code> | The job uuid that you've got when you pushed the job |

**Example**  
```js
verySimpleQueue.handleJobByUuid(
 (payload) => sendEmail(payload.email),
 'd5dfb2d6-b845-4e04-b669-7913bfcb2600'
);
```

* * *

<a name="VerySimpleQueue+handleFailedJob"></a>

#### verySimpleQueue.handleFailedJob(jobHandler, [queue]) ⇒ <code>Promise.&lt;\*&gt;</code>
Handle a job that failed on a given queue

**Kind**: instance method of [<code>VerySimpleQueue</code>](#VerySimpleQueue)  
**Returns**: <code>Promise.&lt;\*&gt;</code> - - A promise of what the jobHandler returns  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| jobHandler | [<code>JobHandler</code>](#module_JobHandler) |  | Function that will receive the payload and handle the job |
| [queue] | <code>string</code> | <code>&quot;default&quot;</code> | The queue from which to take the failed job |

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


## License
[ISC](LICENSE.md)
