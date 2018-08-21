import chalk from 'chalk';
import BaseReporter from './base';

export default class DotReporter extends BaseReporter {
  onStart() {
    this.newLine();
  }

  onUpdate(test) {
    if (test.finished) {
      if (test.passing) {
        this.write(chalk.green('.'));
      } else if (test.failing) {
        this.write(chalk.red('F'));
      } else if (test.skipped) {
        this.write(chalk.white(','));
      }
    }
  }

  onEnd(tests) {
    let passing = tests.filter(t => t.passing);
    let failing = tests.filter(t => t.failing);
    let skipped = tests.filter(t => t.skipped);
    let duration = tests.reduce((d, t) => d + t.duration, 0);

    this.newLine().newLine()
      .log(chalk`{green ${passing.length} passing} {gray ${duration}ms}`);

    if (failing.length) {
      this.log(chalk.red(`${failing.length} failing`));
    }

    if (skipped.length) {
      this.log(chalk.gray(`${skipped.length} skipped`));
    }

    if (failing.length) {
      this.newLine()
        .log(chalk.white.bold.underline(`FAILED TESTS:`));

      let current, depth;
      let printpath = paths => {
        paths.forEach((path, i) => {
          depth = 2 * i;

          if (!current || current[i] !== path) {
            this.indent(depth).log(path);
          }

          depth += 2;
        });

        current = paths;
      };

      failing.forEach((fail, i) => {
        this.newLine();
        printpath(fail.path);

        this.indent(depth)
          .log(chalk.white.bold(`${i + 1}) ${fail.name}`));

        fail.errors.forEach(error => {
          this.newLine()
            .indent(depth).log(chalk.red(`${error.name}: ${error.message}`))
            .indent(depth + 2, chalk.gray(error.stack)).newLine();
        });
      });
    }

    this.newLine();
  }
}
