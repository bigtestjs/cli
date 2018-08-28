import logger from '../../util/logger';

const { assign } = Object;

export default class BasePlugin {
  constructor(options = {}) {
    assign(this, {
      log: logger,
      options
    });
  }

  get name() {
    return this.constructor.name;
  }

  // setup() {}
  // hooks() {}

  // async start() {}
  // async stop() {}
}
