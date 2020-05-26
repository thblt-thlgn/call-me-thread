import { Readable } from 'stream';
import { ProcessorData, QueueStatus, StoppedQueueError } from './typing';
import { EventEmitter } from 'events';
import { RESUME_MESSAGE } from './environment';

type Subsriber<Data extends ProcessorData> = (data: Data) => void;

export class Queue<Data extends ProcessorData> {
  #eventEmitter = new EventEmitter();
  #status: QueueStatus = QueueStatus.running;
  #stream = new Readable({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    read(): void {},
  });
  length = 0;

  get status(): QueueStatus {
    return this.#status;
  }

  constructor(private subscriber: Subsriber<Data>) {
    this.#stream.on('data', this.onData.bind(this));
    this.#eventEmitter.on(RESUME_MESSAGE, this.onResume.bind(this));
  }

  private onResume(): void {
    this.#stream.resume();
    if (this.#status === QueueStatus.stopping && this.length === 0) {
      this.performStop();
    }
  }

  private async onData(data: any): Promise<void> {
    this.#stream.pause();
    this.length -= 1;
    this.subscriber(JSON.parse(data));
  }

  private performStop(): void {
    if (this.#status !== QueueStatus.stopping) {
      throw new StoppedQueueError();
    }
    this.#stream.removeAllListeners('data');
    this.#eventEmitter.removeAllListeners(RESUME_MESSAGE);
    this.#stream.push(null);
    this.#stream.destroy();
    this.#status = QueueStatus.stopped;
  }

  resume(): void {
    if (this.#status === QueueStatus.stopped) {
      throw new StoppedQueueError();
    }

    this.#eventEmitter.emit(RESUME_MESSAGE);
  }

  push(data: Data): void {
    if (this.#status !== QueueStatus.running) {
      throw new StoppedQueueError();
    }

    this.length += 1;
    this.#stream.push(JSON.stringify(data));
  }

  stop(force?: boolean): void {
    if (this.#status !== QueueStatus.running) {
      throw new StoppedQueueError();
    }

    this.#status = QueueStatus.stopping;
    if (this.length === 0 || force) {
      this.performStop();
    } else {
      this.#status = QueueStatus.stopping;
    }
  }
}

export default Queue;
