import Thread from './thread';
import {
  ProcessorData,
  Processor,
  WorkerOptions,
  StoppedPoolError,
  ThreadStatus,
} from './typing';
import { generateUUID } from './utils';
import threadManager from './thread-manager';

export class Pool<
  Input extends ProcessorData = ProcessorData,
  Output extends ProcessorData = ProcessorData
> {
  id = generateUUID();
  #threads = new Set<Thread>();
  #isStopTriggered = false;

  get threads(): Set<Thread> {
    return this.#threads;
  }

  constructor(
    processor: Processor<Input, Output>,
    size: number,
    workerOpts?: WorkerOptions,
  ) {
    for (let i = 0; i < size; i++) {
      const thread = new Thread<Input, Output>(processor, workerOpts);
      this.#threads.add(thread);
    }

    threadManager.register(this);
  }

  private checkIfActionCanBePerformed(): void {
    if (this.#isStopTriggered) {
      throw new StoppedPoolError();
    }
  }

  subscribe(onMessage: (data: Output) => void): Pool {
    this.checkIfActionCanBePerformed();
    this.#threads.forEach((thread) => {
      thread.subscribe(onMessage);
    });

    return this;
  }

  catch(onError: (err: Error) => void): Pool {
    this.checkIfActionCanBePerformed();
    this.#threads.forEach((thread) => {
      thread.catch(onError);
    });

    return this;
  }

  stop(func?: Function, force?: boolean): Pool {
    this.checkIfActionCanBePerformed();
    this.#isStopTriggered = true;
    let stoppedCount = 0;
    this.#threads.forEach((thread) => {
      thread.stop(() => {
        stoppedCount += 1;
        if (func && stoppedCount === this.#threads.size) {
          func();
          threadManager.unregister(this);
        }
      }, force);
    });

    return this;
  }

  pushData(data: Input): Pool {
    this.checkIfActionCanBePerformed();
    const threads = Array.from(this.#threads).sort(
      (a, b) => a.queueLength - b.queueLength,
    );
    const selectedThread =
      threads.find((thread) => thread.status === ThreadStatus.waiting) || threads[0];
    selectedThread.pushData(data);
    return this;
  }
}

export default Pool;
