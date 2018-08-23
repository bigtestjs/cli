import BaseBrowser from './base';
import { maybeResolveLocal } from '../util/common';
import { getDefaultBrowser } from '../util/browsers';
import logger from '../../util/logger';

const { assign } = Object;

export function requireBrowser(name) {
  let module = maybeResolveLocal('browsers', name);

  if (!module) throw new Error(`cannot find browser "${name}"`);

  let Browser = require(module).default;

  if (!(Browser && Browser.prototype instanceof BaseBrowser)) {
    throw new Error(`invalid browser "${name}"`);
  }

  return Browser;
}

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

  async kill() {
    await Promise.all(
      this.launchers.map(launcher => {
        this.log.debug(`Closing ${launcher.name}`);
        return launcher.kill();
      })
    );
  }
}
