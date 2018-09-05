import path from 'path';
import { describe, beforeEach, it } from 'mocha';
import { expect } from '@tests/helpers';

import AdapterPlugin from '@run/plugins/adapter';

describe('Unit: Plugins - Adapter', () => {
  let test;

  beforeEach(() => {
    test = new AdapterPlugin({
      name: 'test',
      path: __filename,
      inject: { head: ['foo'], body: ['bar'] },
      foo: 'bar'
    });
  });

  it('is initialized with provided options', () => {
    expect(test.options).to.deep.equal({
      name: 'test',
      path: __filename,
      inject: { head: ['foo'], body: ['bar'] },
      foo: 'bar'
    });
  });

  describe('setup', () => {
    let client, proxy, sockets, store;

    beforeEach(() => {
      // stub each property the plugin uses
      client = { url: 'testing-url' };

      proxy = {
        inject(...args) {
          proxy.injected = proxy.injected || [];
          proxy.injected.push(args);
        }
      };

      sockets = {
        on(...args) {
          sockets.events = sockets.events || [];
          sockets.events.push(args);
          return sockets;
        }
      };

      // not actually called, only referenced
      store = {
        connectBrowser() {},
        disconnectBrowser() {},
        startTests() {},
        updateTests() {},
        endTests() {}
      };

      // call the setup method
      test.setup(client, proxy, sockets, store);
    });

    it('injects the adapter into the proxy with initialization options', () => {
      let options = JSON.stringify({
        name: 'test',
        foo: 'bar',
        client: 'testing-url'
      });

      expect(proxy.injected[0][0]).to.deep.equal({
        head: [
          'foo',
          { script: '/adapter.js', serve: __filename },
          { script: true, innerContent: `__bigtest__.default.init(${options})` }
        ],
        body: ['bar']
      });
    });

    it('adds the correct store listeners to socket API events', () => {
      expect(sockets.events).to.deep.equal([
        ['adapter/connect', store.connectBrowser],
        ['adapter/disconnect', store.disconnectBrowser],
        ['adapter/start', store.startTests],
        ['adapter/update', store.updateTests],
        ['adapter/end', store.endTests]
      ]);
    });
  });

  describe('mocha adapter', () => {
    beforeEach(() => {
      test = new AdapterPlugin({ name: 'mocha' });
    });

    it('is initialized with default mocha options', () => {
      expect(test.options).to.deep.equal({
        name: 'mocha',
        path: path.join(__dirname, '../../../../lib/run/adapters/mocha.js'),
        inject: { body: [], head: ['mocha/mocha.js'] }
      });
    });
  });
});
