import { copy, existsSync } from 'fs-extra';
import { join } from 'path';

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

export function builder(yargs) {
  yargs.option('network', {
    group: 'Options:',
    description:
      'Generate @bigtest/mirage files for mocking the applications network',
    type: 'boolean',
    default: false
  });

  yargs.option('app-framework', {
    group: 'Options:',
    description: 'Generate the BigTest framework-specific test helper file',
    type: 'string',
    default: 'react'
  });
}

export async function handler(argv) {
  let { network, appFramework } = argv;
  let bigtestDirExists = pathExists(BIGTEST_DIR);
  let networkDirExists = pathExists(`${BIGTEST_DIR}/network`);
  let isCreatingNetwork = !networkDirExists && network;

  if (bigtestDirExists && !isCreatingNetwork) {
    console.log(`\nLooks like BigTest is already initialized\n`);

    return;
  }

  if (bigtestDirExists && isCreatingNetwork) {
    await copyNetwork(appFramework);

    console.log('\n@bigtest/network has been initialized\n');

    return;
  }

  copyWithFramework(appFramework, network).then(({ needsNetwork }) => {
    let networkMessage = needsNetwork ? 'and @bigtest/mirage' : '';

    console.log(
      `\nBigTest has been initialized with @bigtest/${appFramework} ${networkMessage}\n`
    );
  });
}
