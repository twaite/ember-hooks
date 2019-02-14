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

    self.instanceProxy = new Proxy(observed, {
      get: function(target, prop, receiver) {
        return self.get(prop);
      },
      set(obj, prop, value) {
        obj[prop] = value;
        return self.set(prop, value);
      },
    });

  }

  return self.instanceProxy;
};

// export const useComputed = (computedFunction, triggerProperties) {
//   const self = currentInstance;

//   if (currentInstance.._state === 'preRender') {
//     currentInstance
//   }
// }

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