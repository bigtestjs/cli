import { describe, it } from 'mocha';
import { expect, dedent } from '@tests/helpers';
import bigtest from '@tests/acceptance/command';

describe('Acceptance: `bigtest run`', () => {
  it('has help output', async () => {
    let { stdout } = await bigtest('run --help');

    expect(stdout.toString()).to.equal(dedent`
      Usage: bigtest run [options]

      Options:
        --browsers, --browser, -b  One or more browsers to launch  [default: "System Default"]
        --once                     Run once and exit  [boolean] [default: false]
        --opts                     Path to options file  [default: "bigtest/bigtest.opts"]
        --version                  Show version number  [boolean]
        --help                     Show help  [boolean]

      Serve Options:
        --serve, --serve.command  App server command  [array]
        --serve.url               App server URL  [string] [default: "http://localhost:3000"]

      Adapter Options:
        --adapter, --adapter.name  Adapter name  [array]

      Client Options:
        --client.hostname, --client.host  Client server host name  [string] [default: "localhost"]
        --client.port                     Client server port number  [number] [default: 4567]

      Proxy Options:
        --proxy.hostname, --proxy.host  Proxy server host name  [string] [default: "localhost"]
        --proxy.port                    Proxy server port number  [number] [default: 5678]

    `);
  });
});
