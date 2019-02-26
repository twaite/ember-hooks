/* global clone */
// TODO: figure out how to make clone not global

import Mixin from '@ember/object/mixin';
import Component from '@ember/component';
import { A } from '@ember/array';
import { inject as service } from '@ember/service';

let currentInstance = null;

const EmberHooksMixin = Mixin.create({
  init() {
    this._super(...arguments);
    const hooks = this.get('hooks');
    if (hooks) {
      currentInstance = this;
      const vals = hooks.call(currentInstance);
      currentInstance.setProperties(vals);
    }
  },
  willRender() {
    this._super(...arguments);
    const hooks = this.get('hooks');
    if (hooks) {
      currentInstance = this;
      const vals = hooks.call(currentInstance);
      currentInstance.setProperties(vals);
    }
  },
});

export default EmberHooksMixin;

/**
 * TODO: twaite - only add the props the first time
 * This will make it so you can't add new properties that aren't initially defined,
 * but the advantage is that we won't be recreating the proxy every render.
 */
export const useProperties = defaultProps => {
  const self = currentInstance;

  if (self._state === 'preRender' && !self.instanceProxy) {

    // Create a clone of the default props so we can wrap the proxy around a POJO
    const defaultPropsClone = clone(defaultProps);
    const emberizedDefaultPropsClone = emberizeArrays(defaultPropsClone);

    // TODO: twaite - this should handle arrays as ember arrays

    self.setProperties(emberizedDefaultPropsClone);

    self.instanceProxy = observable(defaultProps, self);
  }

  return self.instanceProxy;
};

const emberizeArrays = (obj) => {
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      let value = obj[key];
      value = A(value);
      value = value.map(val => emberizeArrays(val));
      return value;
    })
    return obj;
  }

  return obj;
}

const observable = (obj, scope, ancestors) => {
  if (Array.isArray(obj)) {
    return observableArray(obj, scope, ancestors);
  } else if (typeof obj === 'object') {
    obj.__isProxy = true;
    obj.__ancestors = ancestors;

    Object.keys(obj).forEach(key => {
      if (key !== '__ancestors' && key !== '__isProxy') {
        const prev = obj.__ancestors ? [...obj.__ancestors, key] : [key];
        obj[key] = observable(obj[key], scope, prev);
      }
    });

    return new Proxy(obj, {
      get(target, prop) {
        if (target.__isProxy) {
          return target[prop];
        }

        return scope.get(prop);
      },
      set(obj, prop, value) {
        if (obj.__ancestors) {
          const navigationString = createPropertyNavigationString(obj.__ancestors, prop);
          scope.set(navigationString, value);
        } else {
          scope.set(prop, value);
        }

        obj[prop] = value;

        // Set should return true if it was successful
        return true;
      },
    });
  } else {
    return obj;
  }
};

const emberArrayMap = {
  'push': 'pushObject'
}

const observableArray = (obj, scope, ancestors) => {
  obj.__ancestors = ancestors;
  Object.keys(emberArrayMap).forEach(prop => {
    obj[prop] = new Proxy(obj[prop], {
      apply(target, thisArg, argumentlist) {
        scope.get(thisArg.__ancestors.join('.'))[emberArrayMap[prop]](...argumentlist);
        console.log(scope.get(thisArg.__ancestors.join('.')));
        Reflect.apply(...arguments);
      }
    })
  });

  return obj;
}

const createPropertyNavigationString = (ancestors, prop) => `${ancestors.join('.')}.${prop}`;

export const useStore = () => {
  const self = currentInstance;
  if (self._state === 'preRender') self.set('store', service('store'));
  return self.get('store');
};

export const withHooks = (...args) => {
  // This will get any mixins passed in
  const config = args.pop(args.length - 1);
  return Component.extend(EmberHooksMixin, ...args, {
    hooks() {
      return config(this.attrs);
    },
  });
};
