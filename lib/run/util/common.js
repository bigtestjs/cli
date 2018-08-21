const {
  getOwnPropertyDescriptor,
  getPrototypeOf
} = Object;

/**
 * Checks for a descriptor on the provided object and it's prototype
 *
 * @private
 * @param {Object} obj - Object to lookup the descriptor
 * @param {String} prop - Property descriptor name
 * @returns {Boolean} true when the descriptor is found
 */
export function hasDescriptor(obj, prop) {
  let result = !!getOwnPropertyDescriptor(obj, prop);

  if (!result) {
    result = !!getOwnPropertyDescriptor(getPrototypeOf(obj), prop);
  }

  return result;
}
