import BasePlugin from './base';
import resolveLocal from '../util/resolve-local';

const { assign } = Object;

/**
 * The adapter plugin is responsible for injecting an adapter and
 * other relevant code into the proxy and setting up adapter hooks for
 * the socket API.
 *
 * @param {String} options.name - The adapter name
 * @param {String} [options.module] - The adapter's module path
 * @param {Object} [options.inject] - Other modules to inject
 */
export default class AdapterPlugin extends BasePlugin {
  static name = 'adapter';

  // default options for local adapters
  static defaults = {
    mocha: {
      inject: {
        head: ['mocha/mocha.js']
      }
    }
  };

  constructor(options) {
    let defaults = AdapterPlugin.defaults[options.name];

    // if no module provided, try to resolve the path from the name
    if (!options.module) {
      options = assign({}, options, {
        module: resolveLocal('adapter', options.name)
      });
    }

    super(assign({}, defaults, options));
  }

  /**
   * Injects adapter scripts with initialization options including the
   * client URL and sets up the adapter socket API for updating the
   * store state.
   *
   * @param {ClientServer} client - Client server instance
   * @param {ProxyServer} proxy - Proxy server instance
   * @param {SocketServer} sockets - Socket API server instance
   * @param {Store} store - Coordinator state store
   */
  setup(client, proxy, sockets, store) {
    let { module, inject = {}, ...options } = this.options;

    // stringify options needed by the adapter
    let opts = JSON.stringify(assign({}, options, {
      client: client.url
    }));

    // inject the adapter and supporting elements
    proxy.inject(assign({}, inject, {
      head: (inject.head || []).concat([
        { script: '/adapter.js', serve: module },
        { script: true, innerContent: `__bigtest__.default.init(${opts})` }
      ])
    }));

    // define the adapter API
    sockets
      .on('adapter/connect', store.connectBrowser)
      .on('adapter/disconnect', store.disconnectBrowser)
      .on('adapter/start', store.startTests)
      .on('adapter/update', store.updateTests)
      .on('adapter/end', store.endTests);
  }
}
