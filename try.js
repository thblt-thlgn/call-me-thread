const { ThreadManager } = require('./dist');

const ARRAY_SIZE = 1000000;
const THREADS = 1;

const createArrays = ({ size, maxValue, id }) => {
  return Array.from(new Array(size)).map(() => Math.round(Math.random() * maxValue));
};

const sorter = ({ array }) => {
  return array.sort((a, b) => a - b);
};

const tm = new ThreadManager();
const arrays = [];
const creationPool = tm
  .createPool(createArrays, THREADS)
  .subscribe((array) => {
    arrays.push(array);
  })
  .catch(console.error);
const sortingPool = tm.createPool(sorter, THREADS).catch(console.error);

console.time('Time');
creationPool
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE, id: 1 })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE, id: 2 })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE, id: 3 })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE, id: 4 })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE, id: 5 })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE, id: 6 })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE, id: 7 })
  .pushData({ size: ARRAY_SIZE, maxValue: ARRAY_SIZE, id: 8 })
  .stop(() => {
    arrays.forEach((array) => {
      sortingPool.pushData({ array });
    });
    sortingPool.stop(() => console.timeEnd('Time'));
  });
