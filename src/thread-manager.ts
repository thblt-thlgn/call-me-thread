import * as fs from 'fs';
import { deleteFolderRecursive } from './utils';
import Thread from './thread';
import { THREAD_FOLDER_PATH } from './environment';
import { ProcessorData, Processor, ThreadNotFoundError, ThreadStatus } from './typing';

export class ThreadManager {
  #threads = new Map<string, Thread>();

  constructor() {
    deleteFolderRecursive(THREAD_FOLDER_PATH);
    fs.mkdirSync(THREAD_FOLDER_PATH);
  }

  create<Input extends ProcessorData = ProcessorData, Output extends ProcessorData = ProcessorData>(
    processor: Processor<Input, Output>,
  ): Thread {
    const thread = new Thread<Input, Output>(processor);
    this.#threads.set(thread.id, thread);
    return thread;
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

  stop(threadId: string): void {
    const thread = this.find(threadId);
    thread.stop();
  }

  getStatus(threadId: string): ThreadStatus {
    const thread = this.find(threadId);
    return thread.status;
  }

  runInThread<
    Input extends ProcessorData = ProcessorData,
    Output extends ProcessorData = ProcessorData
  >(processor: Processor<Input, Output>, data: Input): Promise<Output> {
    let response: Output;
    const thread = this.create(processor);
    const onProcess = (data: Output): void => {
      response = data;
      thread.stop();
    };

    return new Promise((resolve, reject) => {
      thread
        .subscribe(onProcess)
        .catch(reject)
        .pushData(data)
        .onStop(() => {
          resolve(response);
        });
    });
  }
}

export default ThreadManager;
