# CallMeThread

![](https://github.com/thblt-thlgn/call-me-thread/workflows/Run%20tests/badge.svg)
[![npm version](https://badge.fury.io/js/%40thblt-thlgn%2Fcall-me-thread.svg)](https://badge.fury.io/js/%40thblt-thlgn%2Fcall-me-thread)

A simple thread implementation using node workers

_Contributions are more than welcome_

## Install

```sh
# Using npm
$ npm install @thblt-thlgn/call-me-thread

# Or using yarn
$ yarn add @thblt-thlgn/call-me-thread
```

## How does it work ?

For each thread or pool you create, a JavaScript worker file is generated, and binded to the API.
It means that this library has the same limitations than NodeJS workers.

Have a look to the [worker API](https://nodejs.org/api/worker_threads.hthreadManagerl) for more details

## How to use ?

### Processor function

The processor function is the one passed to your threads or pools (it's basically the code you wanna run in a thread).
As this function is copied into a generated javascript file, you cannot use variables from outside the processor function.
Hopefully, some options allow you to use external libraries, or worker scoped variables.

```ts
/**
 * @data Object - Data passed from thread.pushData or pool.pushData function
 * @worker Object - Worker scoped data passed on thread or pool creation
 * @libraries Object - Object containing the libraries passed on the thread or pool creation
 */
const processor = (data, workerData, libraries) => {
  // use the workerData
  workerData.calls += 1;

  // use a librarie
  libraries.myLib.doSomething();

  // do some stuff;
  return data.value * 2;
};
```

### Threads

Run a processor function in a NodeJS worker

```ts
import { threadManager, Thread } from '@thblt-thlgn/call-me-thread';

const threadOptions = {
  workerData: {
    calls: 0,
  },
  libraries: [{
    path: 'fs',
    name: 'myLib';
  }]
};

// Threads can be created from the thread-manager
const thread =  threadManager.createThread(processor, threadOptions);

// Or directly using the class
const thread = new Thread(processor, threadOptions);

// You can subscribe to the processed data
thread.subscribe(console.log);

// Or catch the errors if any
thread.catch(console.error);

// You can push data to the thread as many time as you need
// But please note that only primitive data can be pushed (no functions)
thread.pushData({ value: Math.random() });

// And the thread can be stopped when you are done with it
thread.stop(() => {
  console.log('I am printed when all the pushed data is processed by the worker')
})

// Or force the thread stop
thread.stop(() => {
  console.log('I am called before all the pushed data is processed by the worker')
}, true)

// Calls can be chained
thread
  .subscribe(console.log)
  .catch(console.error)
  .pushData({ value: Math.random() })
  .pushData({ value: Math.random() })
  .pushData({ value: Math.random() })
  .stop();
```

Behind the hood, a message queue is implemented (using stream for better memory efficiency) for each thread

### Pools

Run a processor function in a pool of thread.

```ts
import { threadManager, Pool } from '@thblt-thlgn/call-me-thread';

const poolOptions = {
  workerData: {
    calls: 0,
  },
  libraries: [{
    path: 'fs',
    name: 'myLib';
  }]
};

// Pools can be created from the thread-manager
// Here a pool of 4 threads is gonna be created
const pool =  poolManager.createPool(processor, 4, poolOptions);

// Or directly using the class
// Here a pool of 2 threads is gonna be created
const pool = new Pool(processor, 2, poolOptions);

// You can subscribe to the processed data
pool.subscribe(console.log);

// Or catch the errors if any
pool.catch(console.error);

// You can push data to the pool as many time as you need
// But please note that only primitive data can be pushed (no functions)
pool.pushData({ value: Math.random() });

// And the pool can be stopped when you are done with it
pool.stop(() => {
  console.log('I am printed when all my threads are stopped')
})

// Or force the pool stop
pool.stop(() => {
  console.log('Force stop is called on all my threads')
}, true)

// Calls can be chained
pool
  .subscribe(console.log)
  .catch(console.error)
  .pushData({ value: Math.random() })
  .pushData({ value: Math.random() })
  .pushData({ value: Math.random() })
  .stop();
```

Behind the hood, the data will be sent to the threads with the smallest queue.

### Single usage threads / promisified

Sometimes, you just need to run a process in thread, but only once

```ts
import threadManager from '@thblt-thlgn/call-me-thread';

threadManager
  .runInThread(processor, { value: Math.random }, threadOptions)
  .then(console.log)
  .catch(console.error);
```

### Thread-manager

This class is a singleton.
It allows thread and pools creation, as well as storing them (useful for debugging purpose)

```ts
import threadManager from '@thblt-thlgn/call-me-thread';

// Get all the active threads (as a Map)
const threads = threadManager.threads;

// Get all the active pools (as a Map)
const pools = threadManager.pools;

// Create a thread
const thread = threadManager.createThread(processor, threadOptions);

// Create a pool
const pool = threadManager.createPool(processor, 4, threadOptions);

// Create a single usage thread
threadManager
  .runInThread(processor, { value: Math.random }, threadOptions)
  .then(console.log)
  .catch(console.error);
```

## Example

In this example, a pool is used to create some arrays with random values, and another one to sort those arrays.

```js
const threadManager = require('@thbl-thlgn/call-me-thread');
const ARRAY_SIZE = 10000000;
const THREADS = 4;

const createArrays = ({ size, maxValue }) =>
  Array.from(new Array(size)).map(() => Math.round(Math.random() * maxValue));

const sorter = ({ array }) => array.sort((a, b) => a - b);

const sortingPool = threadManager
  .createPool(sorter, THREADS)
  .subscribe(console.log)
  .catch(console.error);

const creationPool = threadManager
  .createPool(createArrays, THREADS)
  .subscribe((array) => {
    sortingPool.pushData({ array });
  })
  .catch(console.error);

console.time('Time');

for (let i = 0; i < 8; i++) {
  creationPool.pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE });
}

creationPool.stop(() => {
  sortingPool.stop(() => console.timeEnd('Time'));
});
```
