import { describe, beforeEach, afterEach, it } from 'mocha';
import { expect, request } from '../helpers';

import WebServer from '../../../lib/run/server';
import ProxyServer from '../../../lib/run/proxy';

describe('ProxyServer', function() {
  let test;

  beforeEach(async () => {
    test = new ProxyServer();
    await test.start();
  });

  afterEach(async () => {
    await test.stop();
  });

  it('is an instance of WebServer', () => {
    expect(test).to.be.an.instanceof(WebServer);
  });

  it('responds to all requests', async () => {
    await expect(request(test.url)).to.eventually
      .have.property('statusCode', 200);
    await expect(request(`${test.url}/foo`)).to.eventually
      .have.property('statusCode', 200);
  });

  it('serves options at `/__bigtest__/`', async () => {
    test.options = { testing: true };

    await expect(request(`${test.url}/__bigtest__/`)).to.eventually
      .have.property('body', '{"testing":true}');
  });

  it('can inject javascripts and other html into requests', async () => {
    test.inject('head', 'head.js');
    test.inject('body', { innerContent: 'let test = true' });
    test.inject('body', { tagName: 'div', innerContent: 'hello' });

    let { body } = await request(test.url);

    /* eslint-disable indent */
    expect(body).to.equal([
      '<html>',
        '<head>',
          '<script src="head.js"></script>',
        '</head>',
        '<body>',
          '<script>let test = true</script>',
          '<div>hello</div>',
        '</body>',
      '</html>'
    ].join(''));
    /* eslint-enable indent */
  });

  it('replaces <server> when the client option is provided', async () => {
    let client = 'http://localhost:1234';

    test.options = { client };
    test.inject('head', '<server>/script.js');

    let { body } = await request(test.url);
    expect(body).to.include(`<script src="${client}/script.js"></script>`);
    await test.stop();
  });

  describe('with a target', async () => {
    let app;

    beforeEach(async () => {
      test.stop();

      app = new WebServer({ port: 8000 });
      app.app.get('/', (req, res) => res.send([
        '<html>',
        '<head></head>',
        '<body>PROXIED</body>',
        '</html>'
      ].join('')));

      test = new ProxyServer({
        target: app.url
      });

      await Promise.all([
        app.start(),
        test.start()
      ]);
    });

    afterEach(async () => {
      await Promise.all([
        app.stop(),
        test.stop()
      ]);
    });

    it('proxies to the app server', async () => {
      await expect(request(test.url)).to.eventually
        .have.property('body').that.includes('PROXIED');
    });

    it('can inject javascripts and other html into requests', async () => {
      test.options.client = 'http://localhost:2222';

      test.inject('head', 'head.js');
      test.inject('head', '<server>/script.js');
      test.inject('body', { innerContent: 'let test = true' });
      test.inject('body', { tagName: 'div', innerContent: 'hello' });

      let { body } = await request(test.url);

      /* eslint-disable indent */
      expect(body).to.equal([
        '<html>',
          '<head>',
            '<script src="head.js"></script>',
            '<script src="http://localhost:2222/script.js"></script>',
          '</head>',
          '<body>',
            'PROXIED',
            '<script>let test = true</script>',
            '<div>hello</div>',
          '</body>',
        '</html>'
      ].join(''));
      /* eslint-enable indent */
    });
  });
});
