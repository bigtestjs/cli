const { assign, entries } = Object;

const hasOwnProperty = (obj, prop) => {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

export default function create(Type, props = {}) {
  let instance = new (class extends Type {
    set(props) {
      if (!entries(props).every(([key, val]) => this[key] === val)) {
        let extended = assign({}, this, props);
        return create(this.constructor, extended);
      } else {
        return this;
      }
    }
  })();

  for (let key in instance) {
    if (props[key] != null) {
      instance[key] = props[key];
    }
  }

  if (hasOwnProperty(Type.prototype, 'initialize')) {
    instance = instance.initialize(props) || instance;
  }

  return instance;
}

export function update(array, index, fn) {
  if (index === -1) index = array.length;

  let item = array[index];
  let updated = fn && fn(item);

  if (item && !updated) {
    return array.slice(0, index)
      .concat(array.slice(index + 1));
  } else if (updated !== item) {
    return array.slice(0, index)
      .concat(updated, array.slice(index + 1));
  } else {
    return array;
  }
}
