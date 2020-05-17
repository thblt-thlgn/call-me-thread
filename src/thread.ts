import * as fs from 'fs';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { generateUUID } from './utils';
import { THREAD_FOLDER_PATH, BASE_THREAD, STOP_MESSAGE } from './environment';
import { ThreadStatus, Processor, ProcessorData } from './types';

export default class Thread<
  Input extends ProcessorData = ProcessorData,
  Output extends ProcessorData = ProcessorData
> {
  id = generateUUID();
  status: ThreadStatus = 'instanciation';
  #worker: Worker | null = null;

  constructor(processor: Processor<Input, Output>) {
    this.createThreadFile(processor);
    const filePath = this.createThreadFile(processor);
    this.#worker = new Worker(filePath);

    this.#worker.on('exit', () => {
      fs.unlinkSync(filePath);
      this.#worker = null;
      this.status = 'stopped';
    });

    this.#worker.on('online', () => {
      this.status = 'running';
    });
  }

  private createThreadFile(processor: Processor): string {
    const filePath = path.join(THREAD_FOLDER_PATH, `${this.id}.js`);

    fs.writeFileSync(filePath, BASE_THREAD.replace('$func', processor.toString()));
    return filePath;
  }

  subscribe(onMessage: (data: Output) => void): Thread {
    this.#worker?.on('message', onMessage);
    return this;
  }

  catch(onError: (err: Error) => void): Thread {
    this.#worker?.on('error', onError);
    return this;
  }

  onStop(func: Function): Thread {
    this.#worker?.on('exit', () => {
      func();
    });
    return this;
  }

  stop(): Thread {
    this.#worker?.postMessage(STOP_MESSAGE);
    return this;
  }

  pushData(data: Input): Thread {
    this.#worker?.postMessage(data);
    return this;
  }
}
