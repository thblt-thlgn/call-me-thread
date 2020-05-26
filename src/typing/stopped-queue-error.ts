export class StoppedQueueError extends Error {
  constructor() {
    super('The queue has been stopped; actions cannot be performed');
  }
}
