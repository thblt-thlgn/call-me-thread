import { Worker, isMainThread } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';
import { deleteFolderRecursive, generateUUID } from './utils';

const THREAD_FOLDER_PATH = path.join(__dirname, '__threads');

export class ThreadManager {
  #threads = new Map<string, Worker>();

  constructor() {
    deleteFolderRecursive(THREAD_FOLDER_PATH);
    fs.mkdirSync(THREAD_FOLDER_PATH);
  }

  private createThreadFile(id: string, func: Function): string {
    const filePath = path.join(THREAD_FOLDER_PATH, `${id}.js`);
    fs.writeFileSync(
      filePath,
      `
const { isMainThread, parentPort, threadId } = require('worker_threads');

if (isMainThread) {
  throw new Error('Cannot be called as a script');
}

const processor = ${func.toString()};

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
    `,
    );
    return filePath;
  }

  add(func: (toProcess: any) => Promise<any>, params: any): void {
    const id = generateUUID();
    const filePath = this.createThreadFile(id, func);
    const worker = new Worker(filePath);
    this.#threads.set(id, worker);

    worker.on('message', (output: any) => {
      console.log(output);
    });

    worker.on('error', (err: Error) => {
      console.log(err);
    });

    worker.on('exit', () => {
      console.log('exit');
    });

    worker.postMessage(params);
  }
}

export default ThreadManager;
