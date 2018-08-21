import { when } from '@bigtest/convergence';

import logger from './logger';
import ClientServer from './client';
import SocketServer from './sockets';
import ProxyServer from './proxy';
import ChildProcess from './process';

import State, {
  Store,
  create
} from './state';

import {
  requireBrowser,
  requireReporter,
  requirePlugin,
  resolveAdapterPath
} from './util/require';
import {
  getDefaultBrowser
} from './util/browsers';

const { assign } = Object;

export default class Coordinator {
  constructor({
    browsers = [],
    plugins = [],
    reporter = 'dot',
    serve = false,
    serveUrl = 'http://localhost:3000',
    logLevel = 'info',
    once = false,
    client: clientOptions = {},
    proxy: proxyOptions = {},
    exit = () => {},
    ...options
  } = {}) {
    this.exit = exit;
    this.once = once;

    // initialize logger and reporter
    this.log = logger({ name: 'BigTest', level: logLevel });
    this.reporter = new (requireReporter(reporter))();

    // initialize state store
    this.store = Store(create(State), this.handleUpdate.bind(this));

    // activate the adapter plugin
    if (options.adapter) {
      // check for a named adapter's path
      options.adapter = assign({
        path: resolveAdapterPath(options.adapter.name)
      }, options.adapter);

      // add the adapter plugin
      plugins.unshift('adapter');
    }

    // initialize browser launchers
    this.launchers = browsers.map(browser => {
      if (browser === 'System Default') {
        browser = getDefaultBrowser();
      }

      return new (requireBrowser(browser))();
    });

    // initialize servers
    this.client = new ClientServer(clientOptions);
    this.sockets = new SocketServer(this.client.server);

    this.proxy = new ProxyServer(assign({
      target: serve && serveUrl
    }, proxyOptions, {
      // always provide the client url and adapter options
      options: assign({}, proxyOptions.options, {
        client: this.client.url,
        adapter: options.adapter
      })
    }));

    // setup plugins
    this.plugins = plugins.map(plugin => {
      let Plugin = requirePlugin(plugin);
      plugin = new Plugin(options[Plugin.name]);
      this.client.serve(plugin.serve);
      this.proxy.inject(plugin.inject);
      return plugin;
    });

    // initialize the serve child process
    if (serve) {
      let [cmd, ...args] = serve.split(' ');

      this.serve = new ChildProcess({
        env: { FORCE_COLOR: true, NODE_ENV: 'testing' },
        name: serve,
        cmd,
        args
      });
    }

    // client API
    this.sockets
      .on('client/connect', (meta, id) => {
        if (id) this.store.updateLaunched(meta, id);
        this.sockets.send(meta.id, 'proxy:connected', this.proxy.url);
      });

    // Adapter API
    this.sockets
      .on('adapter/connect', this.store.connectBrowser)
      .on('adapter/disconnect', this.store.disconnectBrowser)
      .on('adapter/start', this.store.startTests)
      .on('adapter/update', this.store.updateTests)
      .on('adapter/end', this.store.endTests);
  }

  handleUpdate(next, state, args) {
    let results = next(state, args);

    // let the reporter decide what to report
    this.reporter.process(state, results);

    // once finished, maybe stop
    if (results.finished && this.once) {
      this.stop(results.status);

    // servers running & browsers connected
    } else if (results.started) {
      // just started, broadcast run to all connected adapters
      if (!state.started) {
        this.sockets.broadcast('adapter', 'run');

      // signal any newly waiting browsers to run
      } if (state.browsers !== results.browsers) {
        results.browsers.forEach((browser, b) => {
          let prev = state.browsers[b];

          if (!(prev && prev.waiting) && browser.waiting) {
            browser.sockets.forEach((socket, s) => {
              if (!(prev && prev.sockets[s])) {
                this.sockets.send(socket.id, 'run');
              }
            });
          };
        });
      }
    }

    return results;
  }

  async start() {
    try {
      await this.startProxy();
      await this.startClient();
      await this.launchBrowsers();

      // signal start to the state
      this.store.start();

      // catch errors and cleanup
    } catch (err) {
      this.log.error(err);
      await this.stop(1);
    }
  }

  async startProxy() {
    let error;

    this.log.debug('Starting proxy server...');

    // start the serve command before actually starting the proxy
    if (this.serve) {
      this.log.info(`Running "${this.serve.name}"...`);

      // resolves when done running
      this.serve.run().catch(err => {
        this.proxy.stop();
        error = err;
      });

      // forward output
      this.serve.pipe(process);
    }

    // actually start the proxy server
    await this.proxy.start().catch(err => {
      // if serve errored, throw that
      if (error) throw error;
      throw err;
    });

    // stop outputing from serve
    if (this.serve) {
      this.serve.unpipe(process);
      this.log.info(`Serving "${this.proxy.target}"`);
    }
  }

  async startClient() {
    this.log.debug('Starting client server...');

    await this.client.start();
  }

  async launchBrowsers() {
    // launcher browsers
    await Promise.all(this.launchers.map(browser => {
      let target = `${this.client.url}?l=${browser.id}`;
      this.log.info(`Launching ${browser.name}...`);
      this.store.launchBrowser(browser.id);
      return browser.launch(target);
    }));

    // todo: how fix?
    // give browsers 10 seconds to connect
    await when(() => {
      if (!this.store.ready) {
        throw Error('launched browsers did not connect');
      };
    }, 10000);
  }

  async stop(status = 0) {
    this.log.newLine();
    this.log.debug('Shutting down...');

    // kill all browsers
    await Promise.all(this.launchers.map(browser => {
      this.log.debug(`Closing ${browser.name}...`);
      return browser.kill();
    }));

    // stop client and proxy servers
    this.log.debug('Stopping client server...');
    await this.client.stop();

    this.log.debug('Stopping proxy server...');
    await this.proxy.stop();

    // kill serve command
    if (this.serve && this.serve.running) {
      this.log.debug(`Stopping "${this.serve.name}"...`);
      await this.serve.kill();
    }

    return this.exit(status);
  }
}
