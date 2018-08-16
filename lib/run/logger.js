import { getLogger } from 'loglevelnext';
import chalk from 'chalk';

const defaults = {
  level: 'info',
  prefix: {
    template: `${chalk.gray('[{{name}}]')}: `
  }
};

export default function logger(options) {
  let log = getLogger({
    ...defaults,
    ...options
  });

  let error = log.error;

  return Object.assign(log, {
    newLine() { console.log(); },

    error(err) {
      log.newLine();

      if (err.stack) {
        error(chalk.red(err.stack));
      } else {
        error(chalk.red(err));
      }
    }
  });
}
