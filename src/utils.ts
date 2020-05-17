import * as fs from 'fs';
import * as path from 'path';

export const deleteFolderRecursive = (folderPath: string): void => {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });

    fs.rmdirSync(folderPath);
  }
};

export const generateUUID = (): string =>
  (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
