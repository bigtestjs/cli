import BasePlugin from './base';
import { maybeResolveLocal } from '../util/common';

const { assign } = Object;

export function requirePlugin(name) {
  let module = maybeResolveLocal('plugins', name);

  if (!module) throw new Error(`cannot find plugin "${name}"`);

  let Plugin = require(module).default;

  if (!(Plugin && Plugin.prototype instanceof BasePlugin)) {
    throw new Error(`invalid plugin "${name}"`);
  }

  return Plugin;
}

export default class PluginManager {
  constructor(plugins, options) {
    if (options.adapter) {
      plugins = ['adapter', ...plugins];
    }

    if (options.serve) {
      plugins = ['serve', ...plugins];
    }

    assign(this, {
      plugins: plugins.map(plugin => {
        let Plugin = requirePlugin(plugin);
        return new Plugin(options[Plugin.name]);
      })
    });
  }

  setup(client, proxy, sockets, store) {
    for (let plugin of this.plugins) {
      plugin.setup(client, proxy, sockets, store);
    }
  }

  async start() {
    await Promise.all(
      this.plugins
        .filter(plugin => typeof plugin.start === 'function')
        .map(plugin => plugin.start())
    );
  }

  async stop() {
    await Promise.all(
      this.plugins
        .filter(plugin => typeof plugin.stop === 'function')
        .map(plugin => plugin.stop())
    );
  }
}
