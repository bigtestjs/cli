import logger from './logger';
import ClientServer from './client';
import SocketServer from './sockets';
import ProxyServer from './proxy';
import ChildProcess from './process';

import {
  requireBrowser,
  requireReporter,
  requirePlugin,
  resolveAdapterPath
} from './util/require';

const { assign } = Object;

export default class Coordinator {
  constructor({
    browsers = [],
    reporter = 'dot',
    serve = false,
    serveUrl = 'http://localhost:3000',
    logLevel = 'info',
    plugins = [],
    client: clientOptions = {},
    proxy: proxyOptions = {},
    ...options
  } = {}) {
    // initialize logger and reporter
    this.log = logger({ name: 'BigTest', level: logLevel });
    this.reporter = new (requireReporter(reporter))();

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
      .on('client/connect', (meta) => {
        this.sockets.send(meta.id, 'proxy:connected', this.proxy.url);
      });

    this.sockets // adapter API
      .on('adapter/connect', (meta) => {
        this.sockets.send(meta.id, 'run');
      })
      .on('adapter/start', (meta) => {
        this.reporter.handleStart(meta);
      })
      .on('adapter/test:end', (meta, test) => {
        this.reporter.handleTestEnd(meta, test);
      })
      .on('adapter/end', (meta) => {
        this.reporter.handleEnd(meta);
      });
  }

  async start() {
    try {
      await this.startProxy();
      await this.startClient();
      await this.launchBrowsers();

      // add new line between output and reporter
      this.log.newLine();

      // catch errors and cleanup
    } catch (err) {
      this.log.error(err);
      await this.stop();
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
      this.log.info(`Launching ${browser.name}...`);
      return browser.launch(this.client.url);
    }));
  }

  async stop() {
    this.log.newLine();
    this.log.info('Shutting down...');

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
      this.log.info(`Stopping "${this.serve.name}"...`);
      await this.serve.kill();
    }
  }
}
