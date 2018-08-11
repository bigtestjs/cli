import { expect } from 'chai';
import { beforeEach, describe, it } from '@bigtest/mocha';
import { setupApplicationForTesting } from '../helpers/setup-app';

import AppInteractor from '../interactors/app.js';

describe('TodoMVC BigTest example', () => {
  let TodoApp = new AppInteractor();

  beforeEach(() => {
    setupApplicationForTesting();
  });

  // TODO actually fill out tests
  it('does something', () => {
    expect(TodoApp.title).to.equal('Title');
  });
});
