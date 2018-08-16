import { create } from 'microstates';

export default class Browser {
  name = create(String);

  initialize({ connected } = {}) {
    if (connected) {
      return create(ConnectedBrowser, this.state);
    } else {
      return create(DisconnectedBrowser, this.state);
    }
  }

  connect() {
    return this;
  }

  disconnect() {
    return this;
  }
}

export class ConnectedBrowser extends Browser {
  connected = true;

  disconnect() {
    return create(DisconnectedBrowser, this.state);
  }
}

export class DisconnectedBrowser extends Browser {
  connected = false;

  connect() {
    return create(ConnectedBrowser, this.state);
  }
}
