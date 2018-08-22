import fs from 'fs';
import { spawnSync } from 'child_process';
import { promisify } from 'util';

export const mkdir = promisify(fs.mkdir);
export const rimraf = promisify(require('rimraf'));
export const writeFile = promisify(fs.writeFile);

// defaults to utf8 encoding
export const readFile = promisify((file, options, cb = options) => {
  if (typeof options === 'function') options = {};
  return fs.readFile(file, { encoding: 'utf8', ...options }, cb);
});

export const pathExists = path => fs.existsSync(path);
export const binExists = bin => !spawnSync('which', [bin]).status;
