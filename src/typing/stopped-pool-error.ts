export class StoppedPoolError extends Error {
  constructor() {
    super('This pool has been stopped; actions cannot be performed');
  }
}
