import { expect } from 'chai';
import { promisify } from 'util';
import { pathExists, readFile } from 'fs-extra';
import { execFile } from 'child_process';
import { describe, it, afterEach, beforeEach } from 'mocha';
import cleanupFiles from '../../lib/init/utils/clean-up-files';

const CWD = process.cwd();
let exec = promisify(execFile);

describe('bigtest init', () => {
  describe('default init', function() {
    let result;

    beforeEach(async function() {
      result = await exec('node', ['./index.js', 'init']);
    });

    afterEach(async () => {
      await cleanupFiles('bigtest', CWD);
    });

    it('outputs the right message to the console', () => {
      expect(result.stdout).to.equal(
        '\nBigTest has been initialized with @bigtest/react \n\n'
      );
    });

    it('creates a bigtest folder', async function() {
      let hasBigtestFolder = await pathExists(`${CWD}/bigtest`);

      expect(hasBigtestFolder).to.equal(true);
    });

    it('does not create a bigtest network folder', async function() {
      let hasNetworkFolder = await pathExists(`${CWD}/bigtest/network`);

      expect(hasNetworkFolder).to.equal(false);
    });

    it('inits with @bigtest/react', async function() {
      let helperFile = await readFile(
        `${CWD}/bigtest/helpers/setup-app.js`,
        'utf-8'
      );

      expect(
        helperFile.includes(
          "import { setupAppForTesting } from '@bigtest/react';"
        )
      ).to.equal(true);
    });
  });

  describe('bigtest init with network', function() {
    let result;

    beforeEach(async function() {
      result = await exec('node', ['./index.js', 'init', '--network']);
    });

    afterEach(async () => {
      await cleanupFiles('bigtest', CWD);
    });

    it('outputs the right message to the console', () => {
      expect(result.stdout).to.equal(
        '\nBigTest has been initialized with @bigtest/react and @bigtest/mirage\n\n'
      );
    });

    it('creates a bigtest network folder', async function() {
      let hasNetworkFolder = await pathExists(`${CWD}/bigtest/network`);

      expect(hasNetworkFolder).to.equal(true);
    });

    it('inits @bigtest/react helper with @bigtest/mirage setup', async function() {
      let helperFile = await readFile(
        `${CWD}/bigtest/helpers/setup-app.js`,
        'utf-8'
      );

      expect(
        helperFile.includes(
          "import { setupAppForTesting } from '@bigtest/react';"
        )
      ).to.equal(true);
      expect(helperFile.includes('server = startMirage();')).to.equal(true);
    });
  });

  describe('bigtest init with an existing directory', function() {
    let result;

    beforeEach(async function() {
      await exec('node', ['./index.js', 'init']);
    });

    describe('without network', function() {
      beforeEach(async function() {
        result = await exec('node', ['./index.js', 'init']);
      });

      afterEach(async () => {
        await cleanupFiles('bigtest', CWD);
      });

      it('outputs the right message to the console', () => {
        expect(result.stdout).to.equal(
          '\nLooks like BigTest is already initialized\n\n'
        );
      });
    });

    describe('with network', function() {
      beforeEach(async function() {
        result = await exec('node', ['./index.js', 'init', '--network']);
      });

      afterEach(async () => {
        await cleanupFiles('bigtest', CWD);
      });

      it('outputs the right message to the console', () => {
        expect(result.stdout).to.equal(
          '\n@bigtest/network has been initialized\n\n'
        );
      });
    });
  });
});
