import { hasDescriptor } from '../util/common';

const { assign } = Object;

export default class BasePlugin {
  constructor(options) {
    let properties = { options };

    if (!hasDescriptor(this, 'serve')) {
      properties.serve = [];
    }

    if (!hasDescriptor(this, 'inject')) {
      properties.inject = [];
    }

    return assign(this, properties);
  }
}
