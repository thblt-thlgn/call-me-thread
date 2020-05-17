export class ThreadNotFoundError extends Error {
  constructor(id: string) {
    super(`No thread found with ${id} id`);
  }
}
