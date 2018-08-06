export function builder(yargs) {
  yargs
    .option('network', {
      group: 'Options:',
      description: 'Generate @bigtest/network files',
      type: 'boolean',
      default: false
    });
}

export function handler(argv) {
  console.log('init', argv);
}
