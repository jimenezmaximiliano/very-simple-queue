# Simple Job Queue

Simple Job Queue with a simple API and support for sqlite3 (additional drivers on the way)

## Installation

```bash
npm install simple-job-queue
```

## Usage

### Instantiating the SimpleJobQueue facade

```javascript
const SimpleJobQueue = require('simple-job-queue');

const queue = new SimpleJobQueue({
  driver: 'sqlite3',
  filePath: ':memory:',
});

```

### Usage example

```javascript
await queue.createJobsDbStructure(); // Only the first time
await queue.pushJob({ name: "Maxi" }, 'myQueue');
await queue.handleJob((payload) => console.log(payload), 'myQueue');
```

## License
[ISC](LICENSE.md)
