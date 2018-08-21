import create, { update } from './create';

export class BrowserTest {
  browser = 'Unkown';
  duration = 0;

  initialize(props) {
    return this.update(props);
  }

  update(props) {
    if (!this.running && props.running) {
      return create(RunningBrowserTest, props);
    } else if (!this.passing && props.passing) {
      return create(PassingBrowserTest, props);
    } else if (!this.failing && props.failing) {
      return create(FailingBrowserTest, props);
    } else if (!this.skipped && props.skipped) {
      return create(SkippedBrowserTest, props);
    } else if (!this.pending) {
      return create(BrowserTest, props);
    } else {
      return this;
    }
  }

  get pending() {
    return !(
      this.running ||
        this.passing ||
        this.failing ||
        this.skipped
    );
  }

  get finished() {
    return !this.running && (
      this.passing ||
        this.failing ||
        this.skipped
    );
  }
}

export class RunningBrowserTest extends BrowserTest {
  running = true;
}

export class PassingBrowserTest extends BrowserTest {
  passing = true;
}

export class SkippedBrowserTest extends BrowserTest {
  skipped = true;
}

export class FailingBrowserTest extends BrowserTest {
  failing = true;
  errors = [];

  initialize(props) {
    if (props.errors && props.errors.length) {
      return this.set({
        errors: props.errors.map(err => {
          return create(BrowserError, {
            browser: this.browser,
            ...err
          });
        })
      });
    } else {
      return this;
    }
  }
}

export class BrowserError {
  name = 'Error';
  message = 'unknown error';
  browser = 'Unkown';
  stack = null;
}

export default class Test {
  name = '';
  path = [];
  all = [];

  get duration() {
    return this.all.reduce((duration, test) => {
      return Math.max(duration, test.duration);
    }, 0);
  }

  get pending() {
    return this.all.every(test => test.pending);
  }

  get finished() {
    return this.all.every(test => test.finished);
  }

  get running() {
    return this.all.some(test => test.running);
  }

  get passing() {
    return this.all.every(test => test.passing);
  }

  get failing() {
    return this.all.some(test => test.failing);
  }

  get skipped() {
    return this.all.every(test => test.skipped);
  }

  get errors() {
    return this.all.reduce((errors, test) => {
      return test.failing ? errors.concat(test.errors) : errors;
    }, []);
  }

  initialize(props) {
    if (props.browser) {
      return this.update(props);
    } else {
      return this;
    }
  }

  update(props) {
    let index = this.all.findIndex(test => {
      return test.browser === props.browser;
    });

    return this.set({
      all: update(this.all, index, test => {
        return test ? test.update(props) : create(BrowserTest, props);
      })
    });
  }
}
