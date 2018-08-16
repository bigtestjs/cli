import { describe, beforeEach, afterEach, it } from 'mocha';
import { expect, request } from '../helpers';

import WebServer from '../../../lib/run/server';
import ClientServer from '../../../lib/run/client';

describe('ClientServer', () => {
  let test;

  beforeEach(async () => {
    test = new ClientServer();
    await test.start();
  });

  afterEach(async () => {
    await test.stop();
  });

  it('is an instance of WebServer', () => {
    expect(test).to.be.an.instanceof(WebServer);
  });

  it('responds to requests', async () => {
    await expect(request(test.url)).to.eventually
      .have.property('statusCode', 200);
  });

  it('allows serving other files', async () => {
    test.serve('/test', __filename);

    await expect(request(`${test.url}/test`)).to.eventually
      .have.property('statusCode', 200);
  });
});
