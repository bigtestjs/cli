import create, { update } from './create';

export class BrowserSocket {
  id = null;

  get waiting() {
    return !(this.running || this.finished);
  }

  run() {
    if (!this.running) {
      return create(RunningBrowserSocket, this);
    } else {
      return this;
    }
  }
}

export class RunningBrowserSocket extends BrowserSocket {
  running = true;

  done() {
    return create(FinishedBrowserSocket, this);
  }
}

export class FinishedBrowserSocket extends BrowserSocket {
  finished = true;
}

export default class Browser {
  id = null;
  name = 'Unkown';
  launched = false;
  sockets = [];

  get connected() {
    return this.sockets.length > 0;
  }

  get waiting() {
    return this.connected &&
      this.sockets.some(socket => socket.waiting);
  }

  get running() {
    return this.connected &&
      this.sockets.some(socket => socket.running);
  }

  get finished() {
    return this.connected &&
      this.sockets.every(socket => socket.finished);
  }

  connect(sid) {
    let index = this.sockets.findIndex(socket => {
      return socket.id === sid;
    });

    if (index === -1) {
      return this.set({
        sockets: this.sockets.concat(
          create(BrowserSocket, { id: sid })
        )
      });
    } else {
      return this;
    }
  }

  disconnect(sid) {
    let index = this.sockets.findIndex(socket => {
      return socket.id === sid;
    });

    if (index > -1) {
      return this.set({
        sockets: update(this.sockets, index, null)
      });
    } else {
      return this;
    }
  }

  run(sid) {
    let index = this.sockets.findIndex(socket => {
      return socket.id === sid;
    });

    if (index > -1) {
      return this.set({
        sockets: update(this.sockets, index, socket => {
          return socket.run();
        })
      });
    } else {
      return this;
    }
  }

  done(sid) {
    let index = this.sockets.findIndex(socket => {
      return socket.id === sid;
    });

    if (index > -1) {
      return this.set({
        sockets: update(this.sockets, index, socket => {
          return socket.done();
        })
      });
    } else {
      return this;
    }
  }
}
