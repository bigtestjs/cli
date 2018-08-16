import BaseAdapter from './base';

const { mocha } = window;

function gatherSuites(test) {
  let suite = test.parent;
  let suites = [];

  while (!suite.root) {
    suites.push(suite.title);
    suite = suite.parent;
  }

  return suites.reverse();
}

function serializeTest(test) {
  return {
    name: test.title,
    path: gatherSuites(test),
    passing: test.state === 'passed',
    failing: test.state === 'failed',
    skipped: test.pending,
    duration: test.duration,
    error: test.$error
  };
}

function gatherTests(suite) {
  return [].concat(
    suite.tests.map(serializeTest),
    ...suite.suites.map(gatherTests)
  );
}

function formatError({ stack, message }) {
  if (stack) {
    // remove mocha stack entries
    stack = stack.replace(/\n.+\/mocha\/mocha\.js\?\w*:[\d:]+\)?(?=(\n|$))/g, '');
  }

  return {
    message,
    stack
  };
}

export default class MochaAdapter extends BaseAdapter {
  init(options = 'bdd') {
    mocha.setup(options);
    mocha.reporter((runner) => {
      runner.on('start', this.handleStart.bind(this));
      runner.on('end', this.handleEnd.bind(this));
      runner.on('test', this.handleTest.bind(this));
      runner.on('test end', this.handleTestEnd.bind(this));
      runner.on('fail', this.handleFail.bind(this));
    });
  }

  get tests() {
    let tests = gatherTests(mocha.suite);
    Object.defineProperty(this, 'tests', { value: tests });
    return tests;
  }

  handleStart() {
    this.send('start', this.tests);
  }

  handleEnd() {
    this.send('end', this.tests);
  }

  handleTest(test) {
    this.send('test:start', serializeTest(test));
  }

  handleTestEnd(test) {
    this.send('test:end', serializeTest(test));
  }

  handleFail(runnable, error) {
    runnable.$error = formatError(error);

    if (runnable.type === 'hook') {
      this.handleTestEnd(runnable);
    }
  }

  run() {
    mocha.run();
  }
}
