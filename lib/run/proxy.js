import mung from 'express-mung';
import proxy from 'http-proxy-middleware';

import { request } from './util/network';
import WebServer from './server';

const { assign, entries } = Object;
const { isArray } = Array;

/**
 * Proxy server that forwards requests and websockets connections to a
 * provided target and allows injecting scripts into responses.
 *
 * @param {String} [options.target] - Proxy target
 * @param {String} options.client - Client URL provided to adapters
 * @param {Object} [...options] - WebServer options
 */
export default class ProxyServer extends WebServer {
  constructor({
    target,
    options = {},
    ...serverOptions
  } = {}) {
    assign(super(serverOptions), {
      injected: {},
      options,
      target
    });

    // provides an endpoint for adapter options
    this.app.get('/__bigtest__/', (req, res) => {
      res.json(this.options);
    });

    // intercept requests to inject HTML
    this.app.use(mung.write(
      this.handleResponse.bind(this)
    ));

    // given a target, proxy to it
    if (target) {
      this.app.use(proxy({
        logLevel: 'silent',
        ws: true,
        target,

        onError(err, req, res) {
          res.status(500).end(err.message);
        }
      }));
      // no target, send static HTML on every request
    } else {
      this.app.use((req, res) => {
        // todo: template option?
        let body = '<html><head></head><body></body></html>';
        res.set('content-type', 'text/html').write(body);
      });
    }
  }

  /**
   * Adds to the list of scripts that are injected into each response
   *
   * @param {String} id - script ID
   * @param {Object|String} attrs - attributes to set, or src string
   * @returns {ProxyServer} this instance
   */
  inject(where, attrs) {
    // an array of arguments were given to inject
    if (isArray(where)) {
      return where.reduce((self, args) => self.inject(...args), this);
    }

    // if attrs is a string, use it as the src attribute
    if (typeof attrs === 'string') {
      attrs = { src: attrs };
    }

    // concat to existing injected things
    this.injected[where] = (this.injected[where] || []).concat(attrs);

    // return this instance for chaining
    return this;
  }

  /**
   * Formats javascripts as HTML to inject
   *
   * @returns {String} HTML string
   */
  tags(where) {
    return (this.injected[where] || [])
      .map(({ tagName = 'script', innerContent, ...attrs }) => {
        let html = `<${tagName} `;

        if (tagName === 'script') {
          innerContent = innerContent || '';
        }

        html += entries(attrs).map(([a, v]) => {
          return `${a}="${v.replace('<server>', this.options.client)}"`;
        }).join(' ');

        html = html.trim();

        if (innerContent != null) {
          html += `>${innerContent}</${tagName}>`;
        } else {
          html += '/>';
        }

        return html;
      }).join('');
  }

  /**
   * When intercepting responses injects javascript into the bottom of
   * the <body> tag.
   *
   * @param {Buffer|String} body - Intercepted response body
   * @param {String} encoding - unused
   * @param {Request} req - Request object
   * @param {Response} res - Response object
   * @returns {String} the modified body
   */
  handleResponse(body, _, req, res) {
    let isHTML = res.get('content-type').includes('text/html');
    let isOK = res.statusCode >= 200 && res.statusCode < 300;

    if (isHTML && isOK) {
      body = body.toString().replace(/<\/head>/i, this.tags('head') + '$&');
      body = body.toString().replace(/<\/body>/i, this.tags('body') + '$&');
      res.set('content-length', body.length);
    }

    return body;
  }

  /**
   * Verifies that the underlying target can be proxied to. Resolves
   * on success within 2000ms, rejects otherwise.
   *
   * @throws {Error} when unable to proxy to the target
   */
  async verify() {
    if (!this.target) return;

    let self = this;
    let time = Date.now();
    let timeout = 10000;

    this.verifying = true;

    await (async function check() {
      let res = await request(self.target).catch(() => false);
      let isOK = res && res.statusCode >= 200 && res.statusCode < 400;
      let didTimeout = (Date.now() - time) > timeout;
      let didStop = !self.verifying;

      if (didStop) {
        throw new Error('aborted');
      } else if (!isOK) {
        if (didTimeout) {
          self.verifying = false;
          throw new Error(`unable to serve "${self.target}"`);
        } else {
          return check();
        }
      }
    })();

    this.verifying = false;
  }

  /**
   * Overrides the WebServer#start method to first verify that the
   * underlying target can be successfully proxied to.
   */
  async start() {
    await this.verify();
    await WebServer.prototype.start.call(this);
  }

  /**
   * Overrides the WebServer#stop method to ensure that any
   * in-progress verification is aborted.
   */
  async stop() {
    this.verifying = false;
    await WebServer.prototype.stop.call(this);
  }
}
