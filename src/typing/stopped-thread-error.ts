export class StoppedThreadError extends Error {
  constructor() {
    super('This thread has been stopped; actions cannot be performed');
  }
}
