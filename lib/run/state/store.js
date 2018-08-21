const {
  assign,
  defineProperties,
  entries,
  getOwnPropertyDescriptors,
  getPrototypeOf,
  keys
} = Object;

function getPropertyDescriptors(obj) {
  let proto = getPrototypeOf(obj);
  let descriptors = {};

  while (proto && proto !== Object.prototype) {
    descriptors = assign({}, getOwnPropertyDescriptors(proto), descriptors);
    proto = getPrototypeOf(proto);
  }

  return descriptors;
}

export default function Store(state, middle) {
  let store = new (class Store {
    get state() { return state; }
  })();

  let wrap = fn => (...args) => {
    let next = (s, a) => fn.apply(s, a);

    if (middle) {
      state = middle(next, state, args);
    } else {
      state = next(state, args);
    }

    return store;
  };

  let descriptors = entries(getPropertyDescriptors(state))
    .reduce((descriptors, [key, prop]) => {
      // methods
      if (typeof prop.value === 'function' &&
          key !== 'constructor' && key !== 'set') {
        return assign(descriptors, {
          [key]: { value: wrap(prop.value) }
        });
      // getters
      } else if (typeof prop.get === 'function' && key !== 'state') {
        return assign(descriptors, {
          [key]: { get: () => state[key] }
        });
      } else {
        return descriptors;
      }
    }, keys(state).reduce((descriptors, key) => {
      // enumerable properties
      if (key !== 'state') {
        return assign(descriptors, {
          [key]: { get: () => state[key] }
        });
      } else {
        return descriptors;
      }
    }, {}));

  return defineProperties(store, descriptors);
}
