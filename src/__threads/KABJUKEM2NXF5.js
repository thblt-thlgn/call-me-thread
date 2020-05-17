
const { isMainThread, parentPort, threadId } = require('worker_threads');

if (isMainThread) {
  throw new Error('Cannot be called as a script');
}

const processor = (x) => Promise.resolve({ res: x + 123 });

parentPort.on('message', async (value) => {
  try {
    const result = await processor(value);
    parentPort.postMessage({
      ...result,
      threadId,
    });
  } catch (e) {
    parentPort.postMessage({
      error: e,
      threadId,
    });
  }
});
    