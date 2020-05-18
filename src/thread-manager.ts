import * as fs from 'fs';
import { deleteFolderRecursive } from './utils';
import Thread from './thread';
import { THREAD_FOLDER_PATH } from './environment';
import {
  ProcessorData,
  Processor,
  ThreadNotFoundError,
  ThreadStatus,
  WorkerOptions,
} from './typing';
import Pool from './pool';

export class ThreadManager {
  #threads = new Map<string, Thread>();

  constructor() {
    deleteFolderRecursive(THREAD_FOLDER_PATH);
    fs.mkdirSync(THREAD_FOLDER_PATH);
  }

  createThread<
    Input extends ProcessorData = ProcessorData,
    Output extends ProcessorData = ProcessorData
  >(processor: Processor<Input, Output>, workerOpts?: WorkerOptions): Thread {
    const thread = new Thread<Input, Output>(processor, workerOpts);
    this.#threads.set(thread.id, thread);
    return thread;
  }

  createPool<
    Input extends ProcessorData = ProcessorData,
    Output extends ProcessorData = ProcessorData
  >(processor: Processor<Input, Output>, size: number, workerOpts?: WorkerOptions): Pool {
    const pool = new Pool<Input, Output>(processor, size, workerOpts);
    Array.from(pool.threads).forEach((thread) => {
      this.#threads.set(thread.id, thread);
    });

    return pool;
  }

  find(threadId: string): Thread {
    const thread = this.#threads.get(threadId);
    if (!thread) {
      throw new ThreadNotFoundError(threadId);
    }

    return thread;
  }

  pushData(threadId: string, data: ProcessorData): void {
    const thread = this.find(threadId);
    thread.pushData(data);
  }

  stop(threadId: string, func?: Function, force?: boolean): void {
    const thread = this.find(threadId);
    thread.stop(func, force);
  }

  getStatus(threadId: string): ThreadStatus {
    const thread = this.find(threadId);
    return thread.status;
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
}

export default ThreadManager;
