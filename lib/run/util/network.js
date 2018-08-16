import http from 'http';
import https from 'https';
import url from 'url';

/**
 * Helper that listens to a response's `data` and `end` events to
 * determine the response body and resolve with it and the status.
 *
 * @private
 * @param {Function} resolve - Resolve function
 * @param {Response} response - Response object
 */
function resolveResponse(resolve, response) {
  let data = '';

  response.on('data', chunk => {
    data += chunk;
  });

  response.once('end', () => resolve({
    statusCode: response.statusCode,
    body: data
  }));
}

/**
 * Wraps node's `http.request` in a promise that resolves with the
 * `statusCode` and `body` of a response.
 *
 * @private
 * @param {String|Object} options - Options given to `http.request`
 * @returns {Promise}
 */
export const request = options => new Promise((resolve, reject) => {
  http.request(options, resolveResponse.bind(null, resolve))
    .on('error', reject).end();
});

/**
 * Wraps node's `https.request` in a promise that resolves with the
 * `statusCode` and `body` of a response.
 *
 * Defaults the `rejectUnauthorized` option to `false`.
 *
 * @private
 * @param {String|Object} options - Options given to `https.request`
 * @returns {Promise}
 */
request.https = options => new Promise((resolve, reject) => {
  if (typeof options === 'string') options = url.parse(options);
  options = { rejectUnauthorized: false, ...options };
  https.request(options, resolveResponse.bind(null, resolve))
    .on('error', reject).end();
});
