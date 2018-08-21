import path from 'path';
import { readFileSync } from 'fs';
import parse from 'yargs-parser';

import Coordinator from './coordinator';
import { getDefaultBrowser } from './util/browsers';

const { assign } = Object;

export function builder(yargs) {
  yargs
    .option('browsers', {
      group: 'Options:',
      alias: ['browser', 'b'],
      description: 'One or more browsers to launch',
      requiresArg: true,
      default: getDefaultBrowser(),
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
        return parse(
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

export function handler(argv) {
  let c = new Coordinator(assign({}, argv, {
    exit: process.exit
  }));

  process.on('SIGINT', () => c.stop());
  c.start();
}
