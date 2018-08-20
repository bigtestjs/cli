#! /usr/bin/env node

require('yargonaut')
  .style('blue')
  .helpStyle('green.bold')
  .errorsStyle('red.bold');

require('yargs')
  .scriptName('bigtest')
  .version(require('./package.json').version)
  .command('init', false, require('./dist/init'))
  .command('run', false, require('./dist/run'))
  .fail(() => process.exit(1))
  .help()
  .wrap(null)
  .parse();
