import { existsSync } from 'fs-extra';
import chalk from 'chalk';
import cleanupFiles from './utils/clean-up-files';
import { copyNetwork, copyWithFramework } from './utils/copy-with';

const CWD = process.cwd();
const BIGTEST_DIR = `${CWD}/bigtest`;

function builder(yargs) {
  yargs
    .usage(chalk`{green.bold Usage:} $0 run [options]`)
    .option('network', {
      group: 'Options:',
      description:
        'Generate @bigtest/mirage files for mocking the applications network',
      type: 'boolean',
      default: false
    })
    .option('app-framework', {
      group: 'Options:',
      description: 'Generate the BigTest framework-specific test helper file',
      type: 'string',
      default: 'react'
    });
}

async function handler(argv) {
  let { network, appFramework } = argv;
  let bigtestDirExists = existsSync(BIGTEST_DIR);
  let networkDirExists = existsSync(`${BIGTEST_DIR}/network`);
  let isCreatingNetwork = !networkDirExists && network;

  if (bigtestDirExists && !isCreatingNetwork) {
    console.info(`\nLooks like BigTest is already initialized\n`);

    return;
  }

  if (bigtestDirExists && isCreatingNetwork) {
    await copyNetwork(CWD, appFramework);

    console.info('\n@bigtest/network has been initialized\n');

    return;
  }

  try {
    await copyWithFramework(CWD, appFramework, network).then(
      ({ needsNetwork }) => {
        let networkMessage = needsNetwork ? 'and @bigtest/mirage' : '';

        console.info(
          `\nBigTest has been initialized with @bigtest/${appFramework} ${networkMessage}\n`
        );
      }
    );
  } catch (error) {
    console.log(`Initialize failed :( \n${error}`);
    await cleanupFiles('bigtest', CWD);
  }
}

module.exports = {
  command: 'init',
  builder,
  handler
};
