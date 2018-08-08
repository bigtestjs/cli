import { copy, existsSync } from 'fs-extra';
import { join } from 'path';

const CWD = process.cwd();
const BIGTEST_DIR = `${CWD}/bigtest`;
let CLI_TEMPLATE_DIR = join(__dirname, '../../templates');
let pathExists = path => existsSync(path);

let copyWithFramework = (framework, needsNetwork) => {
  let bigtestTemplateDir = needsNetwork ? 'bigtest-network' : 'bigtest';

  return copy(
    `${CLI_TEMPLATE_DIR}/${bigtestTemplateDir}`,
    `${CWD}/bigtest`
  ).then(() => {
    return copy(
      `${CLI_TEMPLATE_DIR}/helpers/${framework}`,
      `${CWD}/bigtest/helpers`
    );
  });
};

export function builder(yargs) {
  yargs.option('network', {
    group: 'Options:',
    description: 'Generate @bigtest/network files',
    type: 'boolean',
    default: false
  });
  yargs.option('app-framework', {
    group: 'Options:',
    description: 'Generate @bigtest/react helper file',
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
    console.log(
      `\nLooks like BigTest is already initialized with @bigtest/${appFramework}\n`
    );

    return;
  }

  if (bigtestDirExists && isCreatingNetwork) {
    return copy(
      `${CLI_TEMPLATE_DIR}/bigtest-network/network`,
      `${CWD}/bigtest/network`
    ).then(() => {
      console.log('\n@bigtest/network has been initialized\n');

      return;
    });
  }

  copyWithFramework(appFramework, network).then(() => {
    console.log(
      `\nBigTest has been initialized with @bigtest/${appFramework}\n`
    );
  });
}
