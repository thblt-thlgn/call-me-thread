import * as fs from 'fs';
import * as path from 'path';

export const THREAD_FOLDER_PATH = path.join(__dirname, '..', '__threads');
export const BASE_THREAD = fs
  .readFileSync(path.join(__dirname, '..', '_worker.js'))
  .toString();
export const STOP_MESSAGE = '__STOP__';
