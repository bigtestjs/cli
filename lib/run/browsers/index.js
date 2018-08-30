import logger from '@util/logger';

import BaseBrowser from './base';
import { maybeResolveLocal } from '../util/common';
import { getDefaultBrowser } from '../util/browsers';

const { assign } = Object;

/**
 * Requires a local browser's or module's default export and ensure's
 * it is an instance of the base browser class.
 *
 * @private
 * @param {String} name - The local browser name, or module path
 * @returns {Browser} the resolved default browser export
 * @throws {Error} when the browser cannot be found, or if the default
 * export is not an instance of the base browser class
 */
export function requireBrowser(name) {
  let module = maybeResolveLocal('browsers', name);

  if (!module) throw new Error(`cannot find browser "${name}"`);

  let Browser = require(module).default;

  if (!(Browser && Browser.prototype instanceof BaseBrowser)) {
    throw new Error(`invalid browser "${name}"`);
  }

  return Browser;
}

/**
 * Requires browser launchers and provides wrapper methods to invoke
 * common browser launcher methods.
 *
 * @private
 * @param {String[]} browsers - Browser launchers to require
 * @param {Store} store - The coordinator's store instance
 */
export default class LauncherManager {
  constructor(browsers, store) {
    assign(this, {
      log: logger,
      store,

      launchers: browsers.map(browser => {
        if (browser === 'System Default') {
          browser = getDefaultBrowser();
        }

        return new (requireBrowser(browser))();
      })
    });
  }

  /**
   * Logs the browser being launched, updates the store, and actually
   * launches the browser with a reference to it's own ID used by the
   * store again later.
   *
   * @param {String} url - Launch target URL
   * @returns {Promise} resolves when all browsers have launched
   */
  async launch(url) {
    await Promise.all(
      this.launchers.map(launcher => {
        let target = `${url}?l=${launcher.id}`;

        this.log.info(`Launching ${launcher.name}...`);
        this.store.launchBrowser(launcher.id);

        return launcher.launch(target);
      })
    );
  }

  /**
   * Logs to debug which browser is closing, then sends the kill
   * signal to each browser launcher.
   *
   * @returns {Promise} resolves when all browsers have closed
   */
  async kill() {
    await Promise.all(
      this.launchers.map(launcher => {
        this.log.debug(`Closing ${launcher.name}`);
        return launcher.kill();
      })
    );
  }
}
