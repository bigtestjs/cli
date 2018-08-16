import path from 'path';

import Browser from '../browsers/base';
import Reporter from '../reporters/base';
import Plugin from '../plugins/base';
import { pathExists } from './common';

/**
 * Checks for the a file in a local directory within this package
 * (browsers, adapters, reporters). If it doesn't exist locally,
 * attempt to resolve the absolute path using `require.resolve`.
 *
 * @private
 * @param {String} dir - Local directory to look in
 * @param {String} name - Name of local file, or module path
 * @returns {String} the module path, or null if not found
 */
export function maybeResolveLocal(dir, name) {
  let local = path.join(__dirname, `../${dir}/${name}.js`);
  let module = pathExists(local) ? local : null;

  // if not local, try to resolve the name directly
  try { module = module || require.resolve(name); } catch (e) {}

  return module;
}

export function requireBrowser(name) {
  let module = maybeResolveLocal('browsers', name);

  if (!module) throw new Error(`cannot find browser "${name}"`);

  let browser = require(module).default;

  if (!(browser && browser.prototype instanceof Browser)) {
    throw new Error(`invalid browser "${name}"`);
  }

  return browser;
}

export function requireReporter(name) {
  let module = maybeResolveLocal('reporters', name);

  if (!module) throw new Error(`cannot find reporter "${name}"`);

  let reporter = require(module).default;

  if (!(reporter && reporter.prototype instanceof Reporter)) {
    throw new Error(`invalid reporter "${name}"`);
  }

  return reporter;
}

export function requirePlugin(name) {
  let module = maybeResolveLocal('plugins', name);

  if (!module) throw new Error(`cannot find plugin "${name}"`);

  let plugin = require(module).default;

  if (!(plugin && plugin.prototype instanceof Plugin)) {
    throw new Error(`invalid plugin "${name}"`);
  }

  return plugin;
}

export function resolveAdapterPath(name) {
  let module = maybeResolveLocal('adapters', name);

  if (!module) throw new Error(`cannot find adapter "${name}"`);

  return module;
}
