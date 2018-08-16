import BasePlugin from './base';

const { assign } = Object;

const defaultOptions = {
  mocha: {
    serve: [
      ['mocha.js', 'mocha/mocha']
    ],
    inject: [
      ['head', '<server>/mocha.js']
    ]
  }
};

export default class AdapterPlugin extends BasePlugin {
  static name = 'adapter';

  // default options per adapter
  constructor(options) {
    // eslint-disable-next-line constructor-super
    return super(assign({}, defaultOptions[options.name], options));
  }

  // files to serve from the client
  get serve() {
    return [
      ...this.options.serve,
      ['adapter.js', this.options.path]
    ];
  }

  // scripts to inject through the proxy
  get inject() {
    return [
      ...this.options.inject,
      ['head', '<server>/adapter.js'],
      ['head', { innerContent: '__bigtest__.default.init()' }],
      ['body', { innerContent: '__bigtest__.default.connect()' }]
    ];
  }
}
