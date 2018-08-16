import { create } from 'microstates';

import Test from './test';
import Browser from './browser';

function findTestIndex(state, test) {
  return state.findIndex(({ name, path }) => {
    return name === test.name && path.every((p, i) => p === test.path[i]);
  });
}

function findBrowserIndex(state, id) {
  return state.findIndex(browser => browser.id === id);
}

export default class State {
  tests = create([Test]);
  browsers = create([Browser]);

  connectBrowser(meta) {
    let index = findBrowserIndex(this.browsers.state, meta.id);
    let result = this;

    if (index === -1) {
      let { id, browser: name } = meta;
      result = result.browsers.push({ id, name });
      index = result.browsers.state.length - 1;
    }

    return result.browsers[index].connect();
  }

  disconnectBrowser(meta) {
    let index = findBrowserIndex(this.browsers.state, meta.id);

    if (index > -1) {
      return this.browsers[index].disconnect();
    } else {
      return this;
    }
  }

  startTests(meta, tests) {
    let t;

    t = Date.now();
    let initial = create([Test], tests.map(test => {
      let { name, path } = test;
      return { name, path };
    }));

    console.log(`create took ${Date.now() - t}ms`);

    t = Date.now();
    let result = this.tests.set(initial);

    console.log(`set took ${Date.now() - t}ms`, '\n');

    return result;
  }

  updateTest(meta, test) {
    let index = findTestIndex(this.tests.state, test);
    let result = this;

    if (index === -1) {
      let { name, path } = test;
      result = result.tests.push({ name, path });
      index = result.tests.state.length - 1;
    }

    return result.tests[index].update(meta, test);
  }
}
