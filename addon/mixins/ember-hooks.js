import Mixin from '@ember/object/mixin';
import Component from '@ember/component';
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

export const useProperties = defaultProps => {
  const self = currentInstance;

  if (self._state === 'preRender' && !self.instanceProxy) {
    self.setProperties(defaultProps);
    const observed = self.getProperties(Object.keys(defaultProps));

    self.instanceProxy = observable(observed, self);
  }

  return self.instanceProxy;
};

const observable = (obj, scope, anscestors) => {
  if (typeof obj === 'object') {
    obj.__isProxy = true;
    obj.__anscestors = anscestors;

    Object.keys(obj).forEach(key => {
      if (key !== '__anscestors' && key !== '__isProxy') {
        const prev = obj.__anscestors ? [...obj.__anscestors, key] : [key];
        obj[key] = observable(obj[key], scope, prev);
      }
    });

    return new Proxy(obj, {
      get(target, prop, receiver) {
        console.log('getting', prop)
        if (target.__isProxy) {
          return target[prop];
        }
        return scope.get(prop);
      },
      set(obj, prop, value) {
        if (obj.__anscestors) {
          console.log('setting dee');
          scope.set(`${obj.__anscestors.join('.')}.${prop}`, value);
        } else {
          scope.set(prop, value);
        }
        return Reflect.set(...arguments);
      },
    });
  } else {
    return obj;
  }
}

export const useStore = () => {
  const self = currentInstance;
  if (self._state === 'preRender') self.set('store', service('store'));
  return self.get('store');
};

export const withHooks = (...args) => {
  const config = args.pop(args.length - 1);
  return Component.extend(EmberHooksMixin, ...args, {
    hooks() {
      console.log(this);
      return config(this.attrs);
    },
  });
}