import create, { update } from './create';
import Browser from './browser';
import Test from './test';

export { default as Store } from './store';
export { create };

export default class State {
  tests = [];
  browsers = [];
  started = false;

  get ready() {
    return this.browsers
      .filter(browser => browser.launched)
      .every(browser => browser.connected);
  }

  get finished() {
    return this.browsers.every(browser => browser.finished);
  }

  get status() {
    return this.tests.some(test => test.failing) ? 1 : 0;
  }

  start() {
    if (!this.started) {
      return this.set({ started: true });
    } else {
      return this;
    }
  }

  launchBrowser(id) {
    return this.set({
      browsers: this.browsers.concat(
        create(Browser, { id, launched: true })
      )
    });
  }

  updateLaunched(meta, id) {
    let index = this.browsers.findIndex(browser => {
      return browser.launched && browser.id === id;
    });

    if (index > -1) {
      return this.set({
        browsers: update(this.browsers, index, browser => {
          return browser.set({ name: meta.browser });
        })
      });
    } else {
      return this;
    }
  }

  connectBrowser(meta) {
    let index = this.browsers.findIndex(browser => {
      return browser.name === meta.browser;
    });

    return this.set({
      browsers: update(this.browsers, index, browser => {
        if (!browser) {
          browser = create(Browser, { name: meta.browser });
        }

        return browser.connect(meta.id);
      })
    });
  }

  disconnectBrowser(meta) {
    let index = this.browsers.findIndex(browser => {
      return browser.name === meta.browser;
    });

    if (index > -1) {
      return this.set({
        browsers: update(this.browsers, index, browser => {
          return browser.disconnect(meta.id);
        })
      });
    } else {
      return this;
    }
  }

  startTests(meta, tests) {
    let index = this.browsers.findIndex(browser => {
      return browser.name === meta.browser;
    });

    if (index > -1) {
      let running = this.set({
        browsers: update(this.browsers, index, browser => {
          return browser.run(meta.id);
        })
      });

      return running.updateTests(meta, tests);
    } else {
      return this;
    }
  }

  updateTests(meta, tests) {
    return this.set({
      tests: tests.reduce((tests, test) => {
        let props = { browser: meta.browser, ...test };

        let index = this.tests.findIndex(test => {
          return test.name === props.name &&
            test.path.every((p, i) => p === props.path[i]);
        });

        return update(tests, index, test => {
          return test ? test.update(props) : create(Test, props);
        });
      }, this.tests)
    });
  }

  endTests(meta) {
    let index = this.browsers.findIndex(browser => {
      return browser.name === meta.browser;
    });

    if (index > -1) {
      return this.set({
        browsers: update(this.browsers, index, browser => {
          return browser.done(meta.id);
        })
      });
    } else {
      return this;
    }
  }
}
