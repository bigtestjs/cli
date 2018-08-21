#! /usr/bin/env node

const chalk = require('chalk');

require('yargonaut')
  .style('red.bold', [
    'Did you mean %s?'
  ])
  .style('blue', [
    'aliases:',
    'default:',
    'boolean',
    'number',
    'string'
  ])
  .style('green.bold', [
    'Commands:',
    'Options:',
    'Client Options:',
    'Proxy Options:',
    'Adapter Options:'
  ]);

require('yargs')
  .scriptName('bigtest')
  .usage(chalk`{green.bold Usage:} $0 <command>`)
  .version(require('./package.json').version)
  .command(require('./dist/init'))
  .command(require('./dist/run'))
  .demandCommand(1, '')
  .recommendCommands()
  .fail((msg, err, yargs) => {
    if (!msg) {
      console.log(yargs.help());
      process.exit();
    } else if (err) {
      console.error(err);
      process.exit(1);
    } else {
      console.error(msg);
      process.exit(1);
    }
  })
  .help()
  .wrap(null)
  .parse();
