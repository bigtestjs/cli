import { setupAppForTesting } from '@bigtest/react';
import { startMirage } from '../network/start';

// Import your applications root.
// This is typically what you pass to `ReactDOM.render`
// import App from '../../src/app.js';

export async function setupApplicationForTesting() {
  await setupAppForTesting(App, {
    mountId: 'bigtesting-container',
    setup: () => {
      this.server = startMirage();
      this.server.logging = false;
    },
    teardown: () => {
      this.server.shutdown();
    }
  });
}
