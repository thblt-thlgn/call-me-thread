import * as fs from 'fs';
import * as path from 'path';
import threadManager from './thread-manager';
import { Worker } from 'worker_threads';
import { generateUUID, generateImports, generateLibraries } from './utils';
import { THREAD_FOLDER_PATH, BASE_THREAD, STOP_MESSAGE } from './environment';
import {
  ThreadStatus,
  Processor,
  ProcessorData,
  WorkerOptions,
  Library,
  StoppedThreadError,
} from './typing';
import Queue from './queue';

export class Thread<
  Input extends ProcessorData = ProcessorData,
  Output extends ProcessorData = ProcessorData
> {
  id = generateUUID();
  status: ThreadStatus = ThreadStatus.initialization;
  #worker: Worker | null = null;
  #isStopTriggered = false;
  #messageQueue = new Queue<Input>((data) => {
    this.status = ThreadStatus.running;
    this.#worker?.postMessage(data);
  });

  get canBeStopped(): boolean {
    return this.#messageQueue.length === 0 && this.status === ThreadStatus.waiting;
  }

  get queueLength(): number {
    return this.#messageQueue.length;
  }

  constructor(processor: Processor<Input, Output>, opts?: WorkerOptions) {
    const filePath = this.createThreadFile(processor, opts?.libraries);

    this.#worker = new Worker(filePath, {
      workerData: opts?.workerData,
    });

    this.#worker.on('exit', () => {
      fs.unlinkSync(filePath);
      this.#worker = null;
      this.status = ThreadStatus.stopped;
    });

    this.#worker.on('message', () => {
      this.status =
        this.#messageQueue.length > 0 ? ThreadStatus.running : ThreadStatus.waiting;
      this.#messageQueue.resume();

      if (this.canBeStopped && this.#isStopTriggered) {
        this.#worker?.postMessage(STOP_MESSAGE);
        threadManager.unregister(this);
      }
    });

    this.#worker.on('online', () => {
      this.status = ThreadStatus.waiting;
    });

    threadManager.register(this);
  }

  private checkIfActionCanBePerformed(): void {
    if (this.#isStopTriggered) {
      throw new StoppedThreadError();
    }
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
    this.checkIfActionCanBePerformed();
    this.#worker?.on('message', onMessage);
    return this;
  }

  catch(onError: (err: Error) => void): Thread {
    this.checkIfActionCanBePerformed();
    this.#worker?.on('error', onError);
    return this;
  }

  stop(func?: Function, force = false): Thread {
    this.checkIfActionCanBePerformed();
    this.#isStopTriggered = true;

    if (func) {
      this.#worker?.on('exit', () => {
        func();
      });
    }

    if (force || this.canBeStopped) {
      this.#worker?.postMessage(STOP_MESSAGE);
      threadManager.unregister(this);
    }

    return this;
  }

  pushData(data: Input): Thread {
    this.checkIfActionCanBePerformed();
    if (this.#isStopTriggered) {
      throw new StoppedThreadError();
    }

    this.#messageQueue.push(data);
    return this;
  }
}

export default Thread;
