import path from 'path';
import express from 'express';
import WebServer from './server';

const { isArray } = Array;

/**
 * Client UI server that simply serves the client directory and any
 * other files provided to the `serve` method.
 *
 * @param {Object} [options] - WebServer options
 */
export default class ClientServer extends WebServer {
  constructor(options) {
    super(options);

    let root = path.join(__dirname, 'client');
    this.app.use(express.static(root));
  }

  /**
   * Serves a given file at the provided path on this server
   *
   * @param {String} path - URL path to serve the file at
   * @param {String} file - Path to file to serve
   */
  serve(path, file) {
    // an array of arguments were given to serve
    if (isArray(path)) {
      return path.reduce((self, args) => self.serve(...args), this);
    }

    // normalize args
    path = path[0] === '/' ? path : `/${path}`;
    file = require.resolve(file);

    // serve the file at the path
    this.app.get(path, (req, res) => res.sendFile(file));

    // return this instance for chaining
    return this;
  }
}
