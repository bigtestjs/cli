import './styles.css';

const { WebSocket } = window;

class Client {
  constructor({ hostname, port }) {
    this.listeners = {};

    this.socket = new WebSocket(`ws://${hostname}:${port}/client`);

    this.socket.addEventListener('message', e => {
      try {
        let { event, data } = JSON.parse(e.data);
        if (event) this.emit(event, data);
      } catch (e) {}
    });
  }

  send(event, data) {
    this.socket.send(JSON.stringify({ event, data }));
  }

  on(event, callback) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    for (let callback of this.listeners[event]) {
      callback.call(this, data);
    }
  }
}

// testing
window.client = new Client(window.location);
window.client.on('proxy:connected', url => {
  let iframe = document.createElement('iframe');
  iframe.setAttribute('src', url);
  document.body.appendChild(iframe);
});
