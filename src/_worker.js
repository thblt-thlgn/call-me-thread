const { isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  throw new Error('Cannot be called as a script');
}

const processor = $func;

parentPort.on('message', async (value) => {
  if (value === '__STOP__') {
    process.exit();
  }
  try {
    const result = await processor(value);
    parentPort.postMessage(result);
  } catch (e) {
    parentPort.postMessage(e);
  }
});
