import { pathExists, readFile } from 'fs-extra';
import { expect, bigtest } from '../helpers';
import { describe, it, afterEach, beforeEach } from 'mocha';
import cleanupFiles from '../../../lib/init/utils/clean-up-files';

const CWD = process.cwd();

describe('Acceptance: `bigtest init`', () => {
  describe('bigtest init', () => {
    let result;

    beforeEach(async () => {
      result = await bigtest('init');
    });

    afterEach(async () => {
      await cleanupFiles('bigtest', CWD);
    });

    it('outputs the right message to the console', () => {
      expect(result.stdout.toString()).to.equal(
        '\nBigTest has been initialized with @bigtest/react \n\n'
      );
    });

    it('creates a bigtest folder', async () => {
      let hasBigtestFolder = await pathExists(`${CWD}/bigtest`);

      expect(hasBigtestFolder).to.equal(true);
    });

    it('does not create a bigtest network folder', async () => {
      let hasNetworkFolder = await pathExists(`${CWD}/bigtest/network`);

      expect(hasNetworkFolder).to.equal(false);
    });

    it('inits with @bigtest/react', async () => {
      let helperFile = await readFile(
        `${CWD}/bigtest/helpers/setup-app.js`,
        'utf-8'
      );

      expect(helperFile).to.include(
        "import { setupAppForTesting } from '@bigtest/react';"
      );
    });
  });

  describe('bigtest init with network', () => {
    let result;

    beforeEach(async () => {
      result = await bigtest('init --network');
    });

    afterEach(async () => {
      await cleanupFiles('bigtest', CWD);
    });

    it('outputs the right message to the console', () => {
      expect(result.stdout.toString()).to.equal(
        '\nBigTest has been initialized with @bigtest/react and @bigtest/mirage\n\n'
      );
    });

    it('creates a bigtest network folder', async () => {
      let hasNetworkFolder = await pathExists(`${CWD}/bigtest/network`);

      expect(hasNetworkFolder).to.equal(true);
    });

    it('inits @bigtest/react helper with @bigtest/mirage setup', async () => {
      let helperFile = await readFile(
        `${CWD}/bigtest/helpers/setup-app.js`,
        'utf-8'
      );

      expect(helperFile).to.include(
        "import { setupAppForTesting } from '@bigtest/react';"
      );
      expect(helperFile).to.include('server = startMirage();');
    });
  });

  describe('bigtest init with an existing directory', () => {
    let result;

    beforeEach(async () => {
      await bigtest('init');
    });

    describe('without network', () => {
      beforeEach(async () => {
        result = await bigtest('init');
      });

      afterEach(async () => {
        await cleanupFiles('bigtest', CWD);
      });

      it('outputs the right message to the console', () => {
        expect(result.stdout.toString()).to.equal(
          '\nLooks like BigTest is already initialized\n\n'
        );
      });
    });

    describe('with network', () => {
      beforeEach(async () => {
        result = await bigtest('init --network');
      });

      afterEach(async () => {
        await cleanupFiles('bigtest', CWD);
      });

      it('outputs the right message to the console', () => {
        expect(result.stdout.toString()).to.equal(
          '\n@bigtest/network has been initialized\n\n'
        );
      });
    });
  });
});
