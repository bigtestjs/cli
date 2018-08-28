import os from 'os';
import path from 'path';
import { describe, beforeEach, it } from 'mocha';
import { expect, readFile, when, defer } from '../helpers';

import Process from '@run/process';
import Browser from '@run/browsers/base';

describe('Unit: Browsers', () => {
  let test;

  class TestBrowser extends Browser {
    name = 'Test Browser';
    command = 'echo';
    arguments = ['big', 'test'];
  }

  beforeEach(() => {
    test = new TestBrowser();
  });

  it('extends the process class', () => {
    expect(test).to.be.an.instanceof(Process);
  });

  it('has a unique id', () => {
    expect(new TestBrowser()).to.have.property('id')
      .that.matches(/^\d{1,4}$/)
      .and.does.not.equal(test.id);
  });

  it('has a reference to the home directory', () => {
    expect(test).to.have.property('homedir')
      .that.equals(os.homedir());
  });

  it('has a reference to it\'s own tmp directory', () => {
    expect(test).to.have.property('tmpdir')
      .that.equals(path.join(os.tmpdir(), `bigtest-test-browser-${test.id}`));
  });

  it('has the ability to write files to and clean up it\'s own tmp directory', async () => {
    let filepath = path.join(test.tmpdir, 'test.txt');

    await test.cleanTmpDir(); // creates the directory when it doesn't exist
    await test.writeFile('test.txt', 'bigtest'); // the tmp directory is implied
    await expect(readFile(filepath)).to.eventually.equal('bigtest');
    await test.cleanTmpDir(); // test cleaning the directory with existing files
    await expect(readFile(filepath)).to.eventually.be.rejected;
  });

  describe('launch', () => {
    it('saves a reference to the launch target', async () => {
      expect(test.target).to.be.undefined;
      await test.launch('http://bigtestjs.io');
      expect(test.target).to.equal('http://bigtestjs.io');
    });

    it('resolves after the browser is running', async () => {
      test.command = 'sleep';
      test.arguments = ['.1'];

      expect(test.running).to.be.false;
      await test.launch();
      expect(test.running).to.be.true;
    });

    it('calls and waits for the `setup` method before running the command', async () => {
      let deferred;

      // defer setup for testing
      test.setup = () => {
        deferred = defer();
        return deferred;
      };

      // do not wait for launch (it will hang)
      test.launch();

      // passes when setup is called but before a process is started
      await when(() => {
        expect(deferred).to.be.an('object');
        expect(test.process).to.be.undefined;
      });

      // resolve setup
      deferred.resolve();

      await when(() => {
        expect(test.running).to.be.true;
      });
    });

    it('cleans up it\'s own tmp directory before calling `setup`', async () => {
      let filepath = path.join(test.tmpdir, 'test.txt');

      test.setup = async () => {
        await expect(readFile(filepath)).to.eventually.be.rejected;
      };

      await test.cleanTmpDir(); // creates the directory when it doesn't exist
      await test.writeFile('test.txt', 'bigtest'); // the tmp directory is implied
      await expect(readFile(filepath)).to.eventually.equal('bigtest');

      // this will also wait for `setup` above
      await expect(test.launch()).to.be.fulfilled;
    });
  });
});
