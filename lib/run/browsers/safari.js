import BaseBrowser from './base';

export default class SafariBrowser extends BaseBrowser {
  name = 'Safari';

  get command() {
    switch (process.platform) {
      case 'darwin':
        // safari interprets command line args as file paths, so we
        // use the `open` command to go directly to the target URL
        return [
          `${this.homedir}/Applications/Safari.app/Contents/MacOS/Safari`,
          '/Applications/Safari.app/Contents/MacOS/Safari'
        ];
      default:
        throw new Error('Safari is not supported on this platform');
    }
  }

  get arguments() {
    return [`${this.tmpdir}/start.html`];
  }

  setup() {
    return this.writeFile('start.html',
      `<script>window.location="${this.target}"</script>`
    );
  }
}
