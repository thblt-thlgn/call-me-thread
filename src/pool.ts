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
    let index = Array.from(this.#threads).findIndex(
      (thread) => thread.status === 'waiting',
    );
    if (index === -1) {
      index = Math.round(Math.random() * (this.#threads.size - 1));
    }
    const selectedThread = Array.from(this.#threads)[index];
    selectedThread.pushData(data);
    return this;
  }
}

export default Pool;
