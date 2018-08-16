import Coordinator from './coordinator';
import { getDefaultBrowser } from './util/browsers';

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
  let c = new Coordinator(argv);
  process.on('SIGINT', () => c.stop());
  c.start();
}
