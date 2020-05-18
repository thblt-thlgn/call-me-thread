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

## How to use ?

```ts
import ThreadManager from '@thblt-thlgn/call-me-thread';
const tm = new ThreadManager();

// Create a new thread
const sumFunction = (params: { a: number; b: number }): number => 
  params.a + params.b;

const thread = tm.createThread(sumFunction)
  .subscribe(console.log)
  .catch(console.error);

// Send data to the thread
thread.pushData({ a: 1, b: 2 })
  .pushData({ a: 4, b: 5 });

// Stop the thread
thread.stop(() => {
  console.log('I will be called when all the data will be processed');
});

// Run as a single call
tm.runInThread(sumFunction, { a: 132, b: 42 })
  .then(console.log)
  .catch(console.error);

// Pass thread scoped data
const workerData = {
  callCounter: 0,
};
const counter = (params, workerData) => {
  workerData.callCounter += 1;
  return `Thread has been called ${workerData.callCounter} times`;
};
tm.createThread(counter, { workerData })
  .subscribe(console.log)
  .pushData({})
  .pushData({})
  .stop();

// Use a library in your thread
const libraries = [
  {
    name: "path",
  },
  {
    name: "stream",
    constName: "customName",
  },
];
const libraryImport = (params, workerData, libraries) => {
  // Do something with path library
  libraries.path.doSomething()

  // Do something with stream library
  libraries.customName.doSomething()

  return "done";
};
tm.runInThread(libraryImport, {}, { libraries })
  .then(console.log);

// Create a pool
tm.createPool(sumFunction, 4)
  .subscribe(console.log)
  .catch(console.error)
  .pushData({ a: 1, b: 2 })
  .pushData({ a: 43, b: 3 })
  .pushData({ a: 123, b: 242 })
  .pushData({ a: 32, b: 23 })
  .pushData({ a: 11, b: 20 })
  .stop(() => {
    console.log('Completed')
  });
```

## Run tests

```sh
$ yarn test
```

## Example

```js
const { ThreadManager } = require('@thblt-thlgn/call-me-thread');
const ARRAY_SIZE = 10000000;
const THREADS = 4;

const createArrays = ({ size, maxValue }) =>
  Array.from(new Array(size)).map(() => Math.round(Math.random() * maxValue));

const sorter = ({ array }) => {
  return array.sort((a, b) => a - b);
};

const tm = new ThreadManager();
const arrays = [];
const creationPool = tm
  .createPool(createArrays, THREADS)
  .subscribe((array) => {
    arrays.push(array);
  })
  .catch(console.error);
const sortingPool = tm.createPool(sorter, THREADS).catch(console.error);

console.time('Time');
creationPool
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE })
  .stop(() => {
    arrays.forEach((array) => {
      sortingPool.pushData({ array });
    });
    sortingPool.stop(() => console.timeEnd('Time'));
  });
```

On my laptop, the result is `Time: 53.751s` with a pool of 8 threads, whereas a pool of 1 thread is `Time: 1:15.745 (m:ss.mmm)`

## Limitations
You cannot use data from outside the processor function scope
