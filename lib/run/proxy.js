import WebServer from './server';

const {
  assign,
  entries,
  defineProperty
} = Object;
const {
  isArray
} = Array;

/**
 * Proxy server that forwards requests and websockets connections to a
 * provided target and allows injecting scripts into responses.
 *
 * @param {String} [options.target] - Proxy target
 * @param {String} options.client - Client URL provided to adapters
 * @param {Object} [...options] - WebServer options
 */
export default class ProxyServer extends WebServer {
  constructor(options) {
    assign(super(options), {
      injected: {}
    });

    // intercept requests to inject HTML
    this.app.use(require('express-mung').write(
      this.handleResponse.bind(this)
    ));
  }

  /**
   * Sets the current target and initializes proxy middleware
   *
   * @param {String} target
   */
  set(target) {
    defineProperty(this, 'target', { value: target });

    this.app.use(require('http-proxy-middleware')({
      logLevel: 'silent',
      ws: true,
      target,

      onError(err, req, res) {
        res.status(500).end(err.message);
      }
    }));
  }

  /**
   * Adds to the list of scripts that are injected into each response
   *
   * @param {String} where - Injected location (`head` or `body`)
   * @param {Object|String} options - Options, or script src string
   * @returns {ProxyServer} this instance
   */
  inject(where, options) {
    // a hash of locations were given
    if (where instanceof Object) {
      return entries(where).reduce((self, args) => {
        return self.inject(...args);
      }, this);
    }

    // an array of options were given
    if (isArray(options)) {
      return options.reduce((self, opts) => {
        return self.inject(where, opts);
      }, this);
    }

    // if attrs is a string, inject a script
    if (typeof options === 'string') {
      options = { script: options };
    }

    // if not an absolute path or url, probably a module to serve
    if (typeof options.script === 'string' &&
        !/^(\/|https?:)/.test(options.script)) {
      options = assign({}, { serve: options.script });
    }

    let {
      serve,
      script,
      ...attrs
    } = options;

    // serve this file
    if (serve) {
      let path = typeof script === 'string' ? script : serve;
      path = path.replace(/^\//, '');
      script = `/__bigtest__/${path}`;
      this.serve(path, serve);
    }

    // script shortcut
    if (script) {
      attrs.tagName = 'script';
      attrs.innerContent = attrs.innerContent || '';

      if (typeof script === 'string') {
        attrs.src = script;
      }
    }

    // concat to existing injected things
    this.injected[where] = (
      this.injected[where] || []
    ).concat(attrs);

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
      .map(({ tagName, innerContent, ...attrs }) => {
        let attrString = entries(attrs)
          .map(([a, v]) => `${a}="${v}"`)
          .join(' ');

        let html = `<${tagName} ${attrString}`;
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
   * Overrides the WebServer#serve method to always serve from the
   * proxy's `__bigtest__` endpoint.
   */
  serve(path, file) {
    if (typeof path === 'string') {
      path = '__bigtest__' + (path[0] === '/' ? path : `/${path}`);
    }

    return WebServer.prototype.serve.call(this, path, file);
  }
}
