import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

const { assign } = Object;

chai.use(chaiAsPromised);

export { expect } from 'chai';
export { when } from '@bigtest/convergence';
export * from '@util/fs';
export * from '@run/util/network';

export function defer() {
  let deferred = {};

  let promise = new Promise((resolve, reject) => {
    assign(deferred, { resolve, reject });
  });

  return assign(deferred, {
    then: promise.then.bind(promise)
  });
}
