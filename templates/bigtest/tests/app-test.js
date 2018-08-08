import { beforeEach, describe, it } from '@bigtest/mocha';
import { expect } from 'chai';
import { setupApplicationForTesting } from '../helpers/setupAppForTesting';

import AppInteractor from '../interactors/app.js';

describe('iTunes app test', () => {
  let TodoApp = new AppInteractor();

  beforeEach(() => {
    setupApplicationForTesting();
  });

  // TODO actually fill out tests
  it('does something', () => {
    expect(TodoApp.title).to.equal('Title');
  });
});
