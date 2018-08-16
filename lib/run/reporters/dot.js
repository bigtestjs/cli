import chalk from 'chalk';
import BaseReporter from './base';

export default class DotReporter extends BaseReporter {
  tests = [];

  handleTestEnd(meta, test) {
    if (test.passing) {
      this.write(chalk.green('.'));
    } else if (test.failing) {
      this.write(chalk.red('F'));
    } else if (test.skipped) {
      this.write(chalk.white(','));
    }

    this.tests.push(test);
  }

  handleEnd(meta) {
    let passing = this.tests.filter(t => t.passing);
    let failing = this.tests.filter(t => t.failing);
    let skipped = this.tests.filter(t => t.skipped);

    this.newLine().newLine()
      .log(chalk.green(`${passing.length} passing`));

    if (failing.length) {
      this.log(chalk.red(`${failing.length} failing`));
    }

    if (skipped.length) {
      this.log(chalk.gray(`${skipped.length} skipped`));
    }

    if (failing.length) {
      this.newLine()
        .log(chalk.white.bold.underline(`FAILED TESTS:`));

      for (let i in failing) {
        let fail = failing[i];

        this.newLine()
          .indent(2).log(chalk.white(`${i}) ${fail.name.state}`))
          .indent(2).log(chalk.red(fail.error.state.message))
          .indent(2).log(chalk.gray(fail.error.state.stack));
      }
    }
  }
}
