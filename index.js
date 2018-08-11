#! /usr/bin/env node

require('yargonaut')
  .style('blue')
  .helpStyle('green.bold')
  .errorsStyle('red.bold');

require('yargs')
  .scriptName('bigtest')
  .version(require('./package.json').version)
  .usage('$0 <command> [options]')
  .command('init', false, require('./dist/commands/init'))
  .help()
  .wrap(null)
  .parse();
