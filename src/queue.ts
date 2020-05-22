import { Readable } from 'stream';
import { ProcessorData } from './typing';
import { EventEmitter } from 'events';

type Subsriber<Data extends ProcessorData> = (data: Data) => void;

export class Queue<Data extends ProcessorData> {
  #eventEmitter = new EventEmitter();
  #stream = new Readable({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    read(): void {},
  });
  length = 0;

  constructor(subscriber: Subsriber<Data>) {
    this.#stream.on('data', async (data) => {
      this.#stream.pause();
      this.length -= 1;
      subscriber(JSON.parse(data));
    });

    this.#eventEmitter.on('resume', () => {
      this.#stream.resume();
    });
  }

  resume(): void {
    this.#eventEmitter.emit('resume');
  }

  push(data: Data): void {
    this.length += 1;
    this.#stream.push(JSON.stringify(data));
  }
}
