#! /usr/bin/env node

require('yargs')
  .scriptName('bigtest')
  .version(require('./package.json').version)
  .command('init', false, require('./dist/commands/init'))
  .help()
  .wrap(null)
  .parse();
