import { createLogger, format, transports } from 'winston';
import chalk from 'chalk';

const logger = createLogger({
  format: format.combine(
    format.label({ label: 'BigTest' }),
    format.printf(info => {
      let { label, level, message } = info;
      let prefix = chalk.gray(`[${label}]`);
      level = level.toUpperCase();

      switch (level) {
        case 'ERROR':
          return chalk`${prefix}: {red ${level}: ${message}}`;
        case 'DEBUG':
          return chalk`${prefix}: {blue ${level}} ${message}`;
        default:
          if (logger.level !== 'info') {
            return chalk`${prefix}: {green ${level}} ${message}`;
          } else {
            return chalk`${prefix}: ${message}`;
          }
      }
    })
  ),

  transports: [
    new transports.Console()
  ]
});

export default logger;
