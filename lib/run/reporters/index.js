import BaseReporter from './base';
import { maybeResolveLocal } from '../util/common';

const { assign } = Object;

export function requireReporter(name) {
  let module = maybeResolveLocal('reporters', name);

  if (!module) throw new Error(`cannot find reporter "${name}"`);

  let Reporter = require(module).default;

  if (!(Reporter && Reporter.prototype instanceof BaseReporter)) {
    throw new Error(`invalid reporter "${name}"`);
  }

  return Reporter;
}

export default class ReporterManager {
  constructor(reporters) {
    assign(this, {
      reporters: [].concat(reporters).map(module => {
        return new (requireReporter(module))();
      })
    });
  }

  process(prev, next) {
    for (let reporter of this.reporters) {
      reporter.process(prev, next);
    }
  }
}
