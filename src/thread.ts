import * as fs from 'fs';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { generateUUID, generateImports, generateLibraries } from './utils';
import { THREAD_FOLDER_PATH, BASE_THREAD, STOP_MESSAGE } from './environment';
import { ThreadStatus, Processor, ProcessorData, WorkerOptions, Library } from './typing';

export class Thread<
  Input extends ProcessorData = ProcessorData,
  Output extends ProcessorData = ProcessorData
> {
  id = generateUUID();
  status: ThreadStatus = 'initialization';
  #worker: Worker | null = null;
  #activeProcessingDataCount = 0;
  #isStopTriggered = false;

  constructor(processor: Processor<Input, Output>, opts?: WorkerOptions) {
    const filePath = this.createThreadFile(processor, opts?.libraries);
    this.#worker = new Worker(filePath, {
      workerData: opts?.workerData,
    });

    this.#worker.on('exit', () => {
      fs.unlinkSync(filePath);
      this.#worker = null;
      this.status = 'stopped';
    });

    this.#worker.on('message', () => {
      this.#activeProcessingDataCount -= 1;
      this.status = this.#activeProcessingDataCount === 0 ? 'waiting' : 'running';

      if (this.#activeProcessingDataCount === 0 && this.#isStopTriggered) {
        this.#worker?.postMessage(STOP_MESSAGE);
      }
    });

    this.#worker.on('online', () => {
      this.status = 'waiting';
    });
  }

  private createThreadFile(processor: Processor, libraries?: Library[]): string {
    const filePath = path.join(THREAD_FOLDER_PATH, `${this.id}.js`);

    let content = BASE_THREAD.replace('$func', processor.toString());
    if (libraries) {
      content = `${generateImports(libraries)}\n${content}`;
      content = content.replace('$libraries', generateLibraries(libraries));
    } else {
      content = content.replace('$libraries', '{}');
    }
    fs.writeFileSync(filePath, content);
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

  stop(func?: Function, force = false): Thread {
    if (func) {
      this.#worker?.on('exit', () => {
        func();
      });
    }

    if (force || this.#activeProcessingDataCount === 0) {
      this.#worker?.postMessage(STOP_MESSAGE);
    } else {
      this.#isStopTriggered = true;
    }
    return this;
  }

  pushData(data: Input): Thread {
    this.#worker?.postMessage(data);
    this.#activeProcessingDataCount += 1;
    this.status = this.#activeProcessingDataCount === 0 ? 'waiting' : 'running';
    return this;
  }
}

export default Thread;
