import * as fs from 'fs';
import * as path from 'path';
import { Library } from './typing';

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

export const toCamelCase = (str: string): string =>
  str
    .replace('_', '-')
    .replace('/', '-')
    .split('-')
    .map((cursor, index) =>
      index === 0
        ? cursor.toLowerCase()
        : `${cursor[0].toUpperCase()}${cursor.slice(1).toLowerCase()}`,
    )
    .join('');

export const generateImports = (libraries: Library[]): string =>
  libraries
    .map((lib) => {
      const constName = lib.constName || toCamelCase(lib.name);
      return `const ${constName} = require('${lib.name}');`;
    })
    .join('\n');

export const generateLibraries = (libraries: Library[]): string =>
  `{ ${libraries.map((lib) => lib.constName || toCamelCase(lib.name)).join(', ')} }`;
