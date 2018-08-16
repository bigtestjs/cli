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

  indent(n) {
    return this.write(''.padStart(n, ' '));
  }

  handleStart() {}
  handleTestEnd() {}
  handleEnd() {}

  // --- microstates testing ---

  prev = null;
  next = null;
  process(next) {
    let { prev } = this;
    this.next = next;

    if (prev && prev !== next) {
      if (prev.tests !== next.tests) {
        for (let i in next.tests.state) {
          let prevTest = prev.tests[i];
          let nextTest = next.tests[i];

          // single test changed
          if (prevTest !== nextTest) {
            // todo: call more generic method instead
            if (!nextTest.pending && !nextTest.running) {
              this.handleTestEnd(null, nextTest);
            }
          }
        }
      }
    }

    this.next = null;
    this.prev = next;
  }
}
