export default class Reporter {
  constructor() {
    this.stdout = process.stdout;
    this.stderr = process.stderr;
  }

  write(string) {
    this.stdout.write(string);
    return this;
  }

  log(msg) {
    return this.write(`${msg}\n`);
  }

  newLine() {
    return this.write('\n');
  }

  indent(n, str = '') {
    return this.write(
      str.replace(/^[\t ]*/gm, () => ''.padStart(n, ' '))
    );
  }

  process(prev, next) {
    // tests started
    if (!prev.started && next.started) {
      this.onStart(next.tests);
    // tests finished
    } else if (!prev.finished && next.finished) {
      this.onEnd(next.tests);
    // tests added or updated
    } else if (prev.tests !== next.tests) {
      // check for test updates
      next.tests.forEach((nextTest, i) => {
        if (prev.tests[i] !== nextTest) {
          this.onUpdate(nextTest);
        }
      });
    }
  }

  onStart() {}
  onUpdate() {}
  onEnd() {}
}
