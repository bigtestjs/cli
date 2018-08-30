import { copy, existsSync } from 'fs-extra';
import { join } from 'path';
import chalk from 'chalk';
import cleanupFiles from './utils/clean-up-files';

const CWD = process.cwd();
const BIGTEST_DIR = `${CWD}/bigtest`;
let CLI_TEMPLATE_DIR = join(__dirname, '../../templates');
let pathExists = path => existsSync(path);

let copyNetwork = async framework => {
  await copy(`${CLI_TEMPLATE_DIR}/network`, `${CWD}/bigtest/network`);
  await copy(
    `${CLI_TEMPLATE_DIR}/helpers/${framework}-network`,
    `${CWD}/bigtest/helpers`
  );

  return true;
};

let copyWithFramework = async (framework, needsNetwork) => {
  await copy(`${CLI_TEMPLATE_DIR}/bigtest`, `${CWD}/bigtest`);
  await copy(
    `${CLI_TEMPLATE_DIR}/helpers/${framework}`,
    `${CWD}/bigtest/helpers`
  );

  if (needsNetwork) {
    await copyNetwork(framework);
  }

  return { needsNetwork };
};

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
  let bigtestDirExists = pathExists(BIGTEST_DIR);
  let networkDirExists = pathExists(`${BIGTEST_DIR}/network`);
  let isCreatingNetwork = !networkDirExists && network;

  if (bigtestDirExists && !isCreatingNetwork) {
    console.info(`\nLooks like BigTest is already initialized\n`);

    return;
  }

  if (bigtestDirExists && isCreatingNetwork) {
    await copyNetwork(appFramework);

    console.info('\n@bigtest/network has been initialized\n');

    return;
  }

  try {
    await copyWithFramework(appFramework, network).then(({ needsNetwork }) => {
      let networkMessage = needsNetwork ? 'and @bigtest/mirage' : '';

      console.info(
        `\nBigTest has been initialized with @bigtest/${appFramework} ${networkMessage}\n`
      );
    });
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
