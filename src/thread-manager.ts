import { Worker } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';
import { deleteFolderRecursive, generateUUID } from './utils';
import Thread from './thread';

type ProcessorData = string | number | boolean | Record<any, any> | any[];
type Processor = (data: ProcessorData) => Promise<ProcessorData>;
const STOP = '__STOP__';

const THREAD_FOLDER_PATH = path.join(__dirname, '__threads');
const BASE_THREAD = fs.readFileSync(path.join(__dirname, '_worker.js')).toString();
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

  create(
    processor: Processor,
    onData: (data: ProcessorData) => void,
    onError: (err: Error) => void,
  ): Thread {
    const id = generateUUID();
    const filePath = this.createThreadFile(id, processor);
    const worker = new Worker(filePath);
    this.#threads.set(id, worker);

    worker.on('message', onData);
    worker.on('error', onError);
    worker.on('exit', () => {
      this.#threads.delete(id);
      fs.unlinkSync(filePath);
    });

    return new Thread(this, id);
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

    worker.postMessage(STOP);
  }

  getStatus(id: string): 'alive' | 'dead' {
    return this.#threads.has(id) ? 'alive' : 'dead';
  }

  runInThread(processor: Processor, data: ProcessorData): Promise<ProcessorData> {
    let response: ProcessorData;
    const id = generateUUID();
    const filePath = this.createThreadFile(id, processor);
    const worker = new Worker(filePath);
    const onProcess = (data: ProcessorData): void => {
      response = data;
      worker.postMessage(STOP);
    };
    this.#threads.set(id, worker);

    return new Promise((resolve, reject) => {
      worker.on('message', onProcess);
      worker.on('error', reject);
      worker.on('exit', () => {
        this.#threads.delete(id);
        fs.unlinkSync(filePath);
        resolve(response);
      });
      worker.postMessage(data);
    });
  }
}

export default ThreadManager;
