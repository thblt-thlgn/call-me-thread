# CallMeThread

![](https://github.com/thblt-thlgn/call-me-thread/workflows/Run%20tests/badge.svg)
[![npm version](https://badge.fury.io/js/%40thblt-thlgn%2Fcall-me-thread.svg)](https://badge.fury.io/js/%40thblt-thlgn%2Fomdb)

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

tm.createThread(sumFunction)
  .subscribe(console.log)
  .catch(console.error);

// Send data to the thread
tm.pushData({ a: 1, b: 2 })
  .pushData({ a: 4, b: 5 });

// Stop the thread
tm.stop(() => {
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
tm.createPool(sum, 4)
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

__NOTE:__ You can pass data and libraries to import using the optionnal parameter on thread creation.

## Run tests

```sh
$ env yarn test
```

## Limitations
You cannot use data from outside the processor function scope
