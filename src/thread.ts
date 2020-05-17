import ThreadManager from './thread-manager';

export default class Thread {
  constructor(private threadManager: ThreadManager, private id: string) {}

  get status(): 'alive' | 'dead' {
    return this.threadManager.getStatus(this.id);
  }

  stop(): void {
    if (this.status === 'alive') {
      this.threadManager.stop(this.id);
    }
  }

  pushData(data: any): void {
    if (this.status === 'alive') {
      this.threadManager.pushData(this.id, data);
    }
  }
}
