# Very Simple Queue
![](https://github.com/actions/jimenezmaximiliano/very-simple-queue/CI/badge.svg)

Very Simple Queue is a job queue with a simple API and support for sqlite3 (additional drivers on the way)

## Installation

```bash
npm install very-simple-queue
```

## Usage

### Instantiating the VerySimpleQueue facade

```javascript
const VerySimpleQueue = require('very-simple-queue');

const queue = new VerySimpleQueue({
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
