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
}
