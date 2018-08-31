import BasePlugin from './base';
import ChildProcess from '../process';
import splitStringArgs from '../util/split-string-args';
import request from '../util/request';

const { assign } = Object;

export default class ServePlugin extends BasePlugin {
  static name = 'serve';

  setup(client, proxy) {
    let { command, env, url } = this.options;
    let [ cmd, ...args ] = splitStringArgs(command);

    proxy.set(url);

    this.serve = new ChildProcess({
      name: 'Serve',
      env: assign({
        FORCE_COLOR: true,
        NODE_ENV: 'testing'
      }, env),
      cmd,
      args
    });
  }

  async start() {
    let { url, timeout } = this.options;
    let error;

    this.log.info(`Running "${this.serve.name}"...`);

    // resolves when done running
    this.serve.run()
      .catch(err => { error = err; });

    // forward output
    this.serve.pipe(process);

    // start checking for a response
    this.check = true;

    let self = this;
    let time = Date.now();

    await (async function check() {
      let res = await request(url).catch(() => false);
      let isOK = res && res.statusCode >= 200 && res.statusCode < 400;

      if (error) {
        throw error;
      } else if (!self.check) {
        throw new Error('aborted');
      } else if (!isOK) {
        if ((Date.now() - time) > timeout) {
          throw new Error(`unable to serve "${url}"`);
        } else {
          return check();
        }
      }
    })();

    this.check = false;

    // stop forwarding output
    this.serve.unpipe(process);

    this.log.info(`Serving "${url}"`);
  }

  async stop() {
    this.log.debug(`Stopping "${this.serve.name}"`);
    await this.serve.kill();

    this.check = false;
  }
}
