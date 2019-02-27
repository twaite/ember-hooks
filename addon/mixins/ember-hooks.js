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
      if (Array.isArray(value)) {
        value = A(value);
        value = value.map(val => emberizeArrays(val));
      }
      return value;
    })
    return obj;
  }

  return obj;
}

const observable = (obj, scope, ancestors) => {
  if (typeof obj === 'object') {
    // Set metadata
    Object.defineProperty(obj, '__isProxy', {
      value: true,
      enumerable: false,
    });
    Object.defineProperty(obj, '__ancestors', {
      value: ancestors,
      enumerable: false,
    })

    Object.keys(obj).forEach(key => {
      const prev = obj.__ancestors ? [...obj.__ancestors, key] : [key];
      obj[key] = observable(obj[key], scope, prev);
    });

    return new Proxy(obj, {
      get(target, prop) {
        if (target.__isProxy) {
          if (Array.isArray(target)) {
            return _handleArrayFunctions(scope, target, prop);
          }
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

        // TODO: tw - Reflect?
        obj[prop] = value;

        // Set should return true if it was successful
        return true;
      },
    });
  } else {
    return obj;
  }
};

const _handleArrayFunctions = (scope, target, prop) => {
  // TODO: tw - should this be an object instead of ifs?
  const emberArray = scope.get(target.__ancestors.join());
  if (prop === 'push') {
    return (val) => {
      emberArray.pushObject(val);
      return target.push(val);
    };
  } else if (prop === 'pop') {
    return () => {
      emberArray.popObject();
      return target.pop();
    }
  } else if (prop === 'shift') {
    return () => {
      emberArray.shiftObject();
      return target.shift();
    }
  } else if (prop === 'unshift') {
    return (...args) => {
      if (args.length === 1) {
        emberArray.unshiftObject(...args);
      } else {
        emberArray.unshiftObjects(args);
      }
      return target.unshift(...args);
    }
  } else if (prop === 'reverse') {
    return () => {
      emberArray.reverseObjects();
      return target.reverse();
    }
  }

  // TODO: tw- should this have a default return, if so what?
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
