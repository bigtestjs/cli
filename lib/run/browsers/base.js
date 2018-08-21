import os from 'os';
import path from 'path';
import { when } from '@bigtest/convergence';

import { mkdir, rimraf, writeFile } from '../../util/fs';
import ChildProcess from '../process';

export default class BaseBrowser extends ChildProcess {
  id = String(Math.floor(Math.random() * 10000));

  get homedir() {
    return os.homedir();
  }

  get tmpdir() {
    let name = this.name.toLowerCase().replace(/\s/g, '-');
    return path.join(os.tmpdir(), `bigtest-${name}-${this.id}`);
  }

  async writeFile(name, content) {
    return writeFile(path.join(this.tmpdir, name), content);
  }

  async cleanTmpDir() {
    return Promise.resolve()
      .then(() => rimraf(this.tmpdir))
      .then(() => mkdir(this.tmpdir));
  }

  async setup() {}

  async launch(url) {
    let error;

    if (this.running) return;
    this.target = url || '';

    await this.cleanTmpDir();
    await this.setup();

    // resolves when done running
    this.run().catch(err => {
      error = err;
    });

    // wait until we're running
    await when(() => this.running || error);

    // reject if an error was encountered
    if (error) throw error;
  }
}
