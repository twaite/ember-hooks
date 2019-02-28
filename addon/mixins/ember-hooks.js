import Mixin from '@ember/object/mixin';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { depsAreEqual } from '../util';

let currentInstance = null;
let hookCallIndex = 0;

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

export const useStore = () => {
  const self = currentInstance;
  if (self._state === 'preRender') self.set('store', service('store'));
  return self.get('store');
};

export const withHooks = (...args) => {
  const config = args.pop(args.length - 1);
  return Component.extend(EmberHooksMixin, ...args, {
    hooks() {
      return config(this.attrs);
    },
  });
}

/**
 * useMemo is a hook that will only recompute a potentially expensive
 * value when one of it's dependencies change.
 *
 * @param {function} createMemoizedValue - function to compute an expensive value
 * @param {Array} deps - Array of dependencies
 */
export const useMemo = (createMemoizedValue, deps) => {
  hookCallIndex++;
  deps = deps === undefined ? null : deps;

  const hook = currentInstance.get('__hookStore');

  const prevState = hook.memoizedState[hookCallIndex];
  if (prevState != null && deps != null) {
    if (depsAreEqual(deps, prevState[1])) {
      return prevState[0];
    }
  }

  const nextState = createMemoizedValue();
  hook.memoizedState[hookCallIndex] = [nextState, deps];
  return nextState;
}

const EmberHooksMixin = Mixin.create({
  init() {
    this._super(...arguments);
    const hooks = this.get('hooks');
    if (hooks) {
      this.set('__hookStore', {
        memoizedState: {}
      });
      currentInstance = this;
      const vals = hooks.call(currentInstance);
      currentInstance.setProperties(vals);
    }
  },
  willRender() {
    hookCallIndex = 0;
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
