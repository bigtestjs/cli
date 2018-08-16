import { create } from 'microstates';

export class BrowserTest {
  browser = create(String);
  duration = create(Number);

  pending = true;
  running = false;
  passing = false;
  failing = false;
  skipped = false;

  update({
    running,
    passing,
    failing,
    skipped
  } = {}) {
    if (running) {
      return this.run();
    } else if (passing) {
      return this.pass();
    } else if (failing) {
      return this.fail();
    } else if (skipped) {
      return this.skip();
    } else {
      return this;
    }
  }

  run() {
    return create(RunningBrowserTest, this.state);
  }

  pass() {
    return create(PassingBrowserTest, this.state);
  }

  fail() {
    return create(FailingBrowserTest, this.state);
  }

  skip() {
    return create(SkippedBrowserTest, this.state);
  }
}

export class RunningBrowserTest extends BrowserTest {
  pending = false;
  running = true;
}

export class PassingBrowserTest extends BrowserTest {
  pending = false;
  passing = true;
}

export class FailingBrowserTest extends BrowserTest {
  error = create(Object);
  pending = false;
  failing = true;
}

export class SkippedBrowserTest extends BrowserTest {
  pending = false;
  skipped = true;
}

export default class Test {
  name = create(String);
  path = create([String]);
  all = create([BrowserTest]);

  get running() {
    return this.all.state.some(test => test.pending);
  }

  get pending() {
    return this.all.state.every(test => test.pending);
  }

  get passing() {
    return this.all.state.every(test => test.passing);
  }

  get failing() {
    return this.all.state.every(test => test.failing);
  }

  get skipped() {
    return this.all.state.every(test => test.skipped);
  }

  get error() {
    return this.all.state.find(test => test.failing).error;
  }

  update(meta, test) {
    let index = findBrowserIndex(this.all.state, meta.id);
    let result = this;

    if (index === -1) {
      let { id, browser } = meta;
      result = result.all.push({ id, browser });
      index = result.all.state.length - 1;
    }

    return result.all[index].update(test);
  }
}

function findBrowserIndex(state, id) {
  return state.findIndex(browser => browser.id === id);
}
