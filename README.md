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
const sumFunction = (params: { a: number; b: number }): number => params.a + params.b;

tm.create(sumFunction)
  .subscribe(console.log)
  .catch(console.error);

// Send data to the thread
tm.pushData({ a: 1, b: 2 })
  .pushData({ a: 4, b: 5 });

// Stop the thread
tm.stop();

// Run as a single call
tm.runInThread(sumFunction, { a: 132, b: 42 })
  .then(console.log)
  .catch(console.error);
```

## Run tests

```sh
$ env API_KEY=my_api_key yarn test
```

## Limitations
You cannot use data from outside the processor function scope