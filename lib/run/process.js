import { spawn } from 'child_process';
import { when } from '@bigtest/convergence';

import { pathExists, binExists } from '../util/fs';
import { hasDescriptor } from './util/common';

const { assign } = Object;

/**
 * Wraps a child process so that it can be started with async start
 * and stop methods. Options can be provided directly, or this class
 * can be extended to provide getters instead. Getters for `cmd` and
 * `args` become `command` and `arguments`.
 *
 * @param {String} [name="child process"] - Name for this process
 * @param {Object} [env={}] - Environment variables to combine with the
 * current process's environment variables
 * @param {String|String[]} [options.cmd] - Command to use with `spawn`
 * @param {String[]} [options.args] - Arguments to use with `spawn`
 */
export default class ChildProcess {
  constructor({
    name = 'child process',
    env = {},
    cmd,
    args
  } = {}) {
    let properties = {
      piped: new Map(),
      running: false
    };

    if (!hasDescriptor(this, 'command')) {
      properties.command = cmd;
    }

    if (!hasDescriptor(this, 'arguments')) {
      properties.arguments = args;
    }

    if (!hasDescriptor(this, 'env')) {
      properties.env = env;
    }

    if (!hasDescriptor(this, 'name')) {
      properties.name = name;
    }

    assign(this, properties);
  }

  /**
   * Starts the child process using `spawn` with this instance's
   * `command` and `arguments` properties. If `command` is an array,
   * the first existing path or bin is used. An error is thrown if the
   * path or bin for a given command cannot be found.
   *
   * The resulting promise will resolve when the process closes or
   * reject if the process signals an `error` event while running.
   *
   * @returns {Promise} resolves after the process closes
   * @throws {Error} when the command cannot be found
   */
  async run() {
    if (this.running) return;

    // find the first existing path or bin
    let cmd = [].concat(this.command)
      .find(c => /\\|\//.test(c) ? pathExists(c) : binExists(c));
    let args = this.arguments || [];

    if (!cmd) {
      throw new Error(`command not found for ${this.name}`);
    }

    let env = assign({}, process.env, this.env);

    // hangs around until the process closes
    return new Promise((resolve, reject) => {
      this.process = spawn(cmd, args, { env });
      this.running = true;

      this.process.once('error', reject);

      this.process.once('exit', code => {
        if (code > 0) {
          reject(new Error(`${cmd} exited with code ${code}`));
        }
      });

      this.process.once('close', () => {
        this.running = false;
        resolve();
      });
    });
  }

  /**
   * If the child process is running, kill it. Resolves once the close
   * event is emitted and the child process is no longer running.
   *
   * If the process takes longer than 2 seconds to close, SIGKILL is
   * sent, and will continue to be sent every 2 seconds until the
   * process finally closes.
   *
   * @param {String} [signal] - Optional signal to send to kill
   * @returns {Promise} resolves when the process is no longer running
   */
  async kill(signal) {
    if (this.running) {
      this.process.kill(signal);
    }

    try {
      await when(() => !this.running);
    } catch (e) {
      return this.kill('SIGKILL');
    }
  }

  /**
   * Pipes stdout and stderr from the child process. When either
   * stream produces output for the first time, a newline is inserted
   * to seperate any previous parent output.
   *
   * @param {Writable} [process.stdout] - stdout to pipe
   * @param {Writable} [process.stderr] - stderr to pipe
   */
  pipe({ stdout, stderr }) {
    if (stdout) this._pipe('stdout', stdout);
    if (stderr) this._pipe('stderr', stderr);
  }

  /**
   * Unpipes stdout and stderr from the child process. If either
   * stream produced output, a newline is inserted to seperate any
   * future parent output.
   *
   * @param {Writable} [process.stdout] - stdout to unpipe
   * @param {Writable} [process.stderr] - stderr to unpipe
   */
  unpipe({ stdout, stderr }) {
    if (stdout) this._unpipe('stdout', stdout);
    if (stderr) this._unpipe('stderr', stderr);
  }

  /**
   * Used to pipe a single stream to `stdout` or `stderr` and stores
   * the necessary meta to track the listener and track if the stream
   * produces any output.
   *
   * @private
   * @param {String} name - "stdout" or "stderr"
   * @param {Writable} stream - stream to pipe
   */
  _pipe(name, stream) {
    if (!this.piped.has(stream)) {
      let meta = { output: false };
      let listener = data => {
        if (!meta.output) {
          stream.write('\n');
          meta.output = true;
        }

        stream.write(data);
      };

      assign(meta, { listener });
      this.piped.set(stream, meta);
      this.process[name].on('data', listener);
    }
  }

  /**
   * Used to unpipe a single stream from `stdout` or `stderr` and
   * deletes any stored meta for the stream.
   *
   * @private
   * @param {String} name - "stdout" or "stderr"
   * @param {Writable} stream - stream to unpipe
   */
  _unpipe(name, stream) {
    if (this.piped.has(stream)) {
      let { output, listener } = this.piped.get(stream);

      stream.write(output ? '\n' : '');
      this.process[name].removeListener('data', listener);
      this.piped.delete(stream);
    }
  }
}
