#! /usr/bin/env node

require('yargs')
  .scriptName('bigtest')
  .version(require('./package.json').version)
  .usage('Usage: $0 <command> [options]')
  .command('$0', false, () =>
    console.log('\nUsage: bigtest <command> [options]\n')
  )
  .command('init', false, require('./dist/commands/init'))
  .help()
  .wrap(null)
  .parse();
