import * as fs from 'fs';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { generateUUID, generateImports, generateLibraries } from './utils';
import { THREAD_FOLDER_PATH, BASE_THREAD, STOP_MESSAGE } from './environment';
import { ThreadStatus, Processor, ProcessorData, WorkerOptions, Library } from './typing';

export default class Thread<
  Input extends ProcessorData = ProcessorData,
  Output extends ProcessorData = ProcessorData
> {
  id = generateUUID();
  status: ThreadStatus = 'instanciation';
  #worker: Worker | null = null;

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

    this.#worker.on('online', () => {
      this.status = 'running';
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
