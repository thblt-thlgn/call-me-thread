import * as fs from 'fs';
import { deleteFolderRecursive } from './utils';
import Thread from './thread';
import { THREAD_FOLDER_PATH } from './environment';
import { ProcessorData, Processor, WorkerOptions } from './typing';
import Pool from './pool';
export class ThreadManager {
  #threads = new Map<string, Thread>();
  #pools = new Map<string, Pool>();

  private static instance: ThreadManager;

  get threads(): Map<string, Thread> {
    return this.#threads;
  }

  get pools(): Map<string, Pool> {
    return this.#pools;
  }

  constructor() {
    if (ThreadManager.instance) {
      return ThreadManager.instance;
    }

    deleteFolderRecursive(THREAD_FOLDER_PATH);
    fs.mkdirSync(THREAD_FOLDER_PATH);
    ThreadManager.instance = this;
  }

  createThread<
    Input extends ProcessorData = ProcessorData,
    Output extends ProcessorData = ProcessorData
  >(processor: Processor<Input, Output>, workerOpts?: WorkerOptions): Thread {
    return new Thread<Input, Output>(processor, workerOpts);
  }

  createPool<
    Input extends ProcessorData = ProcessorData,
    Output extends ProcessorData = ProcessorData
  >(processor: Processor<Input, Output>, size: number, workerOpts?: WorkerOptions): Pool {
    return new Pool<Input, Output>(processor, size, workerOpts);
  }

  runInThread<
    Input extends ProcessorData = ProcessorData,
    Output extends ProcessorData = ProcessorData
  >(
    processor: Processor<Input, Output>,
    data: Input,
    workerOpts?: WorkerOptions,
  ): Promise<Output> {
    let response: Output;
    const thread = this.createThread(processor, workerOpts);
    const onProcess = (data: Output): void => {
      response = data;
    };

    return new Promise((resolve, reject) => {
      thread
        .subscribe(onProcess)
        .catch(reject)
        .pushData(data)
        .stop(() => {
          resolve(response);
        });
    });
  }

  register(worker: Thread | Pool): void {
    if (worker instanceof Thread) {
      this.#threads.set(worker.id, worker);
    } else if (worker instanceof Pool) {
      worker.threads.forEach((thread) => {
        this.#pools.set(worker.id, worker);
        this.#threads.set(thread.id, thread);
      });
    }
  }

  unregister(worker: Thread | Pool): void {
    if (worker instanceof Thread) {
      this.#threads.delete(worker.id);
    } else if (worker instanceof Pool) {
      this.#pools.delete(worker.id);
    }
  }
}

export const threadManager = new ThreadManager();
export default threadManager;
