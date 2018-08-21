import path from 'path';
import { readFileSync } from 'fs';
import chalk from 'chalk';

const { assign } = Object;

function builder(yargs) {
  yargs
    .usage(chalk`{green.bold Usage:} $0 run [options]`)
    .option('browsers', {
      group: 'Options:',
      alias: ['browser', 'b'],
      description: 'One or more browsers to launch',
      requiresArg: true,
      default: 'System Default',
      coerce: browsers => {
        return typeof browsers === 'string'
          ? browsers.split(',')
          : browsers;
      }
    })
    .option('once', {
      group: 'Options:',
      description: 'Run once and exit',
      type: 'boolean',
      default: false
    })
    .config('opts', filepath => {
      try {
        return (require('yargs-parser'))(
          readFileSync(filepath).toString()
            .match(/"[^"]*"|\S+/g).map(arg => {
              return arg.replace(/^("|')(.*)(\1)$/, '$2');
            })
        );
      } catch (error) {
        if (filepath !== path.resolve('bigtest/bigtest.opts')) {
          throw error;
        }
      }
    })
    .option('opts', {
      group: 'Options:',
      description: 'Path to options file',
      type: 'string',
      default: 'bigtest/bigtest.opts'
    })
    .option('client.hostname', {
      group: 'Client Options:',
      alias: ['client.host'],
      description: 'Client server host name',
      requiresArg: true,
      type: 'string',
      default: 'localhost'
    })
    .option('client.port', {
      group: 'Client Options:',
      description: 'Client server port number',
      requiresArg: true,
      type: 'number',
      default: 4567
    })
    .option('proxy.hostname', {
      group: 'Proxy Options:',
      alias: ['proxy.host'],
      description: 'Proxy server host name',
      requiresArg: true,
      type: 'string',
      default: 'localhost'
    })
    .option('proxy.port', {
      group: 'Proxy Options:',
      description: 'Proxy server port number',
      requiresArg: true,
      type: 'number',
      default: 5678
    })
    .option('adapter', {
      group: 'Adapter Options:',
      description: 'Adapter name',
      requiresArg: true,
      coerce: adapter => {
        return typeof adapter === 'string'
          ? { name: adapter }
          : adapter;
      }
    });
}

function handler(argv) {
  let Coordinator = require('./coordinator').default;

  let options = assign({}, argv, {
    exit: process.exit
  });

  let c = new Coordinator(options);
  process.on('SIGINT', () => c.stop());
  c.start();
}

module.exports = {
  command: 'run',
  aliases: ['r'],
  builder,
  handler
};
