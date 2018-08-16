import fs from 'fs';
import { spawnSync } from 'child_process';
import { promisify } from 'util';

const {
  getOwnPropertyDescriptor,
  getPrototypeOf
} = Object;

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

/**
 * Checks for a descriptor on the provided object and it's prototype
 *
 * @private
 * @param {Object} obj - Object to lookup the descriptor
 * @param {String} prop - Property descriptor name
 * @returns {Boolean} true when the descriptor is found
 */
export function hasDescriptor(obj, prop) {
  let result = !!getOwnPropertyDescriptor(obj, prop);

  if (!result) {
    result = !!getOwnPropertyDescriptor(getPrototypeOf(obj), prop);
  }

  return result;
}
