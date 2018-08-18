import http from 'http';
import express from 'express';
import { when } from '@bigtest/convergence';

const { assign } = Object;

/**
 * Generic web server class that adds async start and stop methods and
 * initializes an empty express app.
 *
 * @param {String} [options.hostname=localhost] - Server host name
 * @param {NUmber} [options.port=3000] - Server port number
 */
export default class WebServer {
  constructor({
    hostname = 'localhost',
    port = 3000
  } = {}) {
    let app = express();
    let server = http.createServer(app);

    assign(this, {
      connections: new Set(),
      running: false,
      hostname,
      port,
      server,
      app
    });
  }

  /**
   * The root URL for this server instance
   */
  get url() {
    return `http://${this.hostname}:${this.port}`;
  }

  /**
   * Asynchronously starts this server instance
   *
   * @returns {Promise} resolves once the server is listening
   * @throws {Error} when the server errors while starting
   */
  async start() {
    let error = null;

    let errHandler = err => {
      this.server.close();
      error = err;
    };

    let listenHandler = () => {
      this.server.removeListener('error', errHandler);
      this.running = true;
    };

    this.server.once('error', errHandler);
    this.server.once('listening', listenHandler);
    this.server.on('connection', this.handleConnection.bind(this));
    this.server.listen(this.port, this.hostname);

    await when(() => this.running || !!error);
    if (error) throw error;
  }

  /**
   * Asynchronously stops this server instance
   *
   * @returns {Promise} resolves once the server has closed
   */
  async stop() {
    // when not open, callback is immediately invoked
    this.server.close(() => {
      this.running = false;
    });

    for (let socket of this.connections) {
      socket.destroy();
    }

    // resolve when the server is no longer running
    await when(() => !this.running);
  }

  /**
   * Tracks incoming connections so that they can be safely destroyed
   * if the server is closed.
   *
   * @private
   * @param {Socket} socket - Incoming connection
   */
  handleConnection(socket) {
    this.connections.add(socket);

    socket.once('close', () => {
      this.connections.delete(socket);
    });
  }
}
