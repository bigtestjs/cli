import { describe, it } from 'mocha';
import { expect } from '@tests/helpers';

import PluginManager from '@run/plugins';
import BasePlugin from '@run/plugins/base';
import AdapterPlugin from '@run/plugins/adapter';
import ServePlugin from '@run/plugins/serve';

class TestPlugin extends BasePlugin {
  static options = 'test';
  fail = false;
  calls = {};

  setup(...args) {
    this.calls.setup = this.calls.setup || [];
    this.calls.setup.push(args);
  }

  async start(...args) {
    this.calls.start = this.calls.start || [];
    this.calls.start.push(args);
    if (this.fail) throw new Error('failed');
  }

  async stop(...args) {
    this.calls.stop = this.calls.stop || [];
    this.calls.stop.push(args);
    if (this.fail) throw new Error('failed');
  }
}

describe('Unit: Plugin - Manager', () => {
  it('automatically includes local plugins', () => {
    let test = new PluginManager(['serve']);
    expect(test.plugins).to.have.a.lengthOf(1);
    expect(test.plugins[0]).to.be.an.instanceof(ServePlugin);
  });

  it('passes nested options defined by a static plugin property', () => {
    let test = new PluginManager(['serve'], { serve: { foo: 'bar' } });
    expect(test.plugins[0].options).to.deep.equal({ foo: 'bar' });
  });

  it('automatically enables the serve plugin when serve options are provided', () => {
    let test = new PluginManager([], { serve: { foo: 'bar' } });
    expect(test.plugins).to.have.a.lengthOf(1);
    expect(test.plugins[0]).to.be.an.instanceof(ServePlugin);
    expect(test.plugins[0].options).to.deep.equal({ foo: 'bar' });
  });

  it('automatically enables the adapter plugin when adapter options are provided', () => {
    let test = new PluginManager([], { adapter: { name: 'mocha' } });
    expect(test.plugins).to.have.a.lengthOf(1);
    expect(test.plugins[0]).to.be.an.instanceof(AdapterPlugin);
    expect(test.plugins[0].options).to.deep.include({ name: 'mocha' });
  });

  it('allows custom plugins to be provided', () => {
    let test = new PluginManager([TestPlugin], { test: { hello: 'world' } });
    expect(test.plugins).to.have.a.lengthOf(1);
    expect(test.plugins[0]).to.be.an.instanceof(TestPlugin);
    expect(test.plugins[0].options).to.deep.equal({ hello: 'world' });
  });

  it('invokes setup for all plugins', () => {
    let test = new PluginManager([TestPlugin, TestPlugin]);
    test.setup(1, 2, 3, 4);

    expect(test.plugins[0].calls.setup[0]).to.deep.equal([1, 2, 3, 4]);
    expect(test.plugins[1].calls.setup[0]).to.deep.equal([1, 2, 3, 4]);
  });

  it('invokes start for all plugins and resolves when done', async () => {
    let test = new PluginManager([TestPlugin, TestPlugin]);
    await expect(test.start()).to.be.fulfilled;

    expect(test.plugins[0].calls.start).to.have.a.lengthOf(1);
    expect(test.plugins[1].calls.start).to.have.a.lengthOf(1);
  });

  it('invokes start for all plugins and rejects when one does', async () => {
    let test = new PluginManager([TestPlugin, TestPlugin]);

    test.plugins[0].fail = true;
    await expect(test.start()).to.be.rejected;

    expect(test.plugins[0].calls.start).to.have.a.lengthOf(1);
    expect(test.plugins[1].calls.start).to.have.a.lengthOf(1);
  });

  it('invokes stop for all plugins and resolves when done', async () => {
    let test = new PluginManager([TestPlugin, TestPlugin]);
    await expect(test.stop()).to.be.fulfilled;

    expect(test.plugins[0].calls.stop).to.have.a.lengthOf(1);
    expect(test.plugins[1].calls.stop).to.have.a.lengthOf(1);
  });

  it('invokes stop for all plugins and rejects when one does', async () => {
    let test = new PluginManager([TestPlugin, TestPlugin]);

    test.plugins[1].fail = true;
    await expect(test.stop()).to.be.rejected;

    expect(test.plugins[0].calls.stop).to.have.a.lengthOf(1);
    expect(test.plugins[1].calls.stop).to.have.a.lengthOf(1);
  });
});
