import BaseReporter from './base';
import { maybeResolveLocal } from '../util/common';

const { assign } = Object;

/**
 * Requires a local reporter's or module's default export and ensure's
 * it is an instance of the base reporter class.
 *
 * @private
 * @param {String} name - The local reporter name, or module path
 * @returns {Reporter} the resolved default reporter export
 * @throws {Error} when the reporter cannot be found, or if the default
 * export is not an instance of the base reporter class
 */
export function requireReporter(name) {
  let module = maybeResolveLocal('reporters', name);

  if (!module) throw new Error(`cannot find reporter "${name}"`);

  let Reporter = require(module).default;

  if (!(Reporter && Reporter.prototype instanceof BaseReporter)) {
    throw new Error(`invalid reporter "${name}"`);
  }

  return Reporter;
}

/**
 * Requires reporters and provides wrapper methods to invoke common
 * reporter methods.
 *
 * @private
 * @param {String[]} reporters - Reporters to require
 */
export default class ReporterManager {
  constructor(reporters) {
    assign(this, {
      reporters: [].concat(reporters).map(module => {
        return new (requireReporter(module))();
      })
    });
  }

  /**
   * Invokes the process method for all reporters
   *
   * @param {State} prev - The previous state instance
   * @param {State} next - The resulting state instance
   */
  process(prev, next) {
    for (let reporter of this.reporters) {
      reporter.process(prev, next);
    }
  }
}
