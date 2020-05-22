import Thread from './thread';
import { ProcessorData, Processor, WorkerOptions } from './typing';

export class Pool<
  Input extends ProcessorData = ProcessorData,
  Output extends ProcessorData = ProcessorData
> {
  #threads = new Set<Thread>();

  constructor(
    processor: Processor<Input, Output>,
    size: number,
    workerOpts?: WorkerOptions,
  ) {
    for (let i = 0; i < size; i++) {
      const thread = new Thread<Input, Output>(processor, workerOpts);
      this.#threads.add(thread);
    }
  }

  get threads(): Set<Thread> {
    return this.#threads;
  }

  subscribe(onMessage: (data: Output) => void): Pool {
    Array.from(this.#threads).forEach((thread) => {
      thread.subscribe(onMessage);
    });

    return this;
  }

  catch(onError: (err: Error) => void): Pool {
    Array.from(this.#threads).forEach((thread) => {
      thread.catch(onError);
    });

    return this;
  }

  stop(func?: Function, force?: boolean): Pool {
    let stoppedCount = 0;
    Array.from(this.#threads).forEach((thread) => {
      thread.stop(() => {
        stoppedCount += 1;
        if (func && stoppedCount === this.#threads.size) {
          func();
        }
      }, force);
    });

    return this;
  }

  pushData(data: Input): Pool {
    const threads = Array.from(this.#threads).sort(
      (a, b) => a.queueLength - b.queueLength,
    );
    const selectedThread =
      threads.find((thread) => thread.status === 'waiting') || threads[0];
    selectedThread.pushData(data);
    return this;
  }
}

export default Pool;
