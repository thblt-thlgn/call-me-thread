import Queue from '../src/queue';
import { QueueStatus } from '../src/typing';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as faker from 'faker';
describe('queue', () => {
  describe('create', () => {
    it('should allow to create a queue', () => {
      const queue = new Queue(() => {
        queue.resume();
      });
      expect(queue).to.be.instanceOf(Queue);
      queue.stop();
    });
  });

  describe('resume', () => {
    it('should not pick the next item if the queue is not resumed', () => {});
  });

  describe('stop', () => {
    it('should allow to stop a queue', () => {
      const queue = new Queue(() => {
        queue.resume();
      });

      queue.stop();
      expect(queue.status).to.be.equal(QueueStatus.stopped);
    });

    it('should wait for all the data to be proceeded before the queue stops', () => {
      return new Promise((resolve) => {
        const queue = new Queue(() => {
          expect(queue.status).to.be.equal(QueueStatus.stopping);
          queue.resume();
          expect(queue.status).to.be.equal(QueueStatus.stopped);
          resolve();
        });

        queue.push(Math.random());
        queue.stop();
        expect(queue.status).to.be.equal(QueueStatus.stopping);
      });
    });

    it('should allow to force stop a queue', () => {
      const queue = new Queue(() => {
        queue.resume();
      });

      queue.push(Math.random());
      queue.stop(true);
      expect(queue.status).to.be.equal(QueueStatus.stopped);
    });

    it('should not receive data after the queue has been force stoped', () => {
      const queue = new Queue(() => {
        queue.resume();
      });
      const spy = sinon.spy(queue.resume);

      queue.push(Math.random());
      queue.push(Math.random());
      queue.push(Math.random());
      queue.push(Math.random());
      queue.stop(true);
      expect(queue.status).to.be.equal(QueueStatus.stopped);
      expect(spy.callCount).to.be.equal(0);
    });

    it('should throw an error if trying to push data after the queues has been stopped', () => {});
    it('should throw an error if trying to resume after the queues has been stopped', () => {});
    it('should throw an error if trying to stop after the queues has been stopped', () => {});
  });

  describe('push', () => {
    it('should retrieve strings passed to the queue', () => {
      const data = Array.from(new Array(10)).map(() => faker.lorem.sentences(20));
      let index = 0;

      return new Promise((resolve) => {
        const queue = new Queue((item) => {
          expect(data[index++]).to.be.equal(item);
          queue.resume();
          if (index >= data.length) {
            queue.stop();
            resolve();
          }
        });

        data.forEach((item) => {
          queue.push(item);
        });
      });
    });

    it('should retrieve numbers passed to the queue', () => {
      const data = Array.from(new Array(10)).map(() => faker.random.number(100000));
      let index = 0;

      return new Promise((resolve) => {
        const queue = new Queue((item) => {
          expect(data[index++]).to.be.equal(item);
          queue.resume();
          if (index >= data.length) {
            queue.stop();
            resolve();
          }
        });

        data.forEach((item) => {
          queue.push(item);
        });
      });
    });

    it('should retrieve booleans passed to the queue', () => {
      const data = Array.from(new Array(10)).map(() => faker.random.number(100000));
      let index = 0;

      return new Promise((resolve) => {
        const queue = new Queue((item) => {
          expect(data[index++]).to.be.equal(item);
          queue.resume();
          if (index >= data.length) {
            queue.stop();
            resolve();
          }
        });

        data.forEach((item) => {
          queue.push(item);
        });
      });
    });

    it('should retrieve booleans passed to the queue', () => {
      const data = Array.from(new Array(10)).map(() => faker.random.boolean());
      let index = 0;

      return new Promise((resolve) => {
        const queue = new Queue((item) => {
          expect(data[index++]).to.be.equal(item);
          queue.resume();
          if (index >= data.length) {
            queue.stop();
            resolve();
          }
        });

        data.forEach((item) => {
          queue.push(item);
        });
      });
    });

    it('should retrieve arrays passed to the queue', () => {
      const data = Array.from(new Array(10)).map(() =>
        Array.from(new Array(10)).map(() => ({
          number: faker.random.number(10000),
          boolean: faker.random.boolean(),
          string: faker.lorem.sentences(20),
        })),
      );
      let index = 0;

      return new Promise((resolve) => {
        const queue = new Queue((item) => {
          expect(data[index++].toString()).to.be.equal(item.toString());
          queue.resume();
          if (index >= data.length) {
            queue.stop();
            resolve();
          }
        });

        data.forEach((item) => {
          queue.push(item);
        });
      });
    });

    it('should retrieve objects passed to the queue', () => {
      const data = Array.from(new Array(10)).map(() => ({
        number: faker.random.number(10000),
        boolean: faker.random.boolean(),
        string: faker.lorem.sentences(20),
      }));
      let index = 0;

      return new Promise((resolve) => {
        const queue = new Queue((item) => {
          expect(data[index++].toString()).to.be.equal(item.toString());
          queue.resume();
          if (index >= data.length) {
            queue.stop();
            resolve();
          }
        });

        data.forEach((item) => {
          queue.push(item);
        });
      });
    });
  });
});
