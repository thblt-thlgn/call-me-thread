import { Worker, isMainThread } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';
import { deleteFolderRecursive, generateUUID } from './utils';

const THREAD_FOLDER_PATH = path.join(__dirname, '__threads');
const BASE_THREAD = fs.readFileSync(path.join(__dirname, 'base-thread.js')).toString();
export class ThreadManager {
  #threads = new Map<string, Worker>();

  constructor() {
    deleteFolderRecursive(THREAD_FOLDER_PATH);
    fs.mkdirSync(THREAD_FOLDER_PATH);
  }

  private createThreadFile(id: string, func: Function): string {
    const filePath = path.join(THREAD_FOLDER_PATH, `${id}.js`);

    fs.writeFileSync(filePath, BASE_THREAD.replace('$func', func.toString()));
    return filePath;
  }

  start(processor: (...params: any[]) => Promise<any>, onProcess: Function): string {
    const id = generateUUID();
    const filePath = this.createThreadFile(id, processor);
    const worker = new Worker(filePath);
    this.#threads.set(id, worker);

    worker.on('message', (output: any) => {
      onProcess(output);
    });

    worker.on('error', (err: Error) => {
      onProcess(err);
    });

    worker.on('exit', () => {
      this.#threads.delete(id);
      fs.unlinkSync(filePath);
    });

    return id;
  }

  pushData(threadId: string, data: any): void {
    const worker = this.#threads.get(threadId);
    if (!worker) {
      throw new Error(`No thread found with ${threadId} id`);
    }

    worker.postMessage(data);
  }

  stop(threadId: string): void {
    const worker = this.#threads.get(threadId);
    if (!worker) {
      throw new Error(`No thread found with ${threadId} id`);
    }

    worker.postMessage('__STOP__');
  }
}

export default ThreadManager;
