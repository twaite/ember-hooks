import Mixin from '@ember/object/mixin';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { depsAreEqual } from '../utils/memo';

type MemoizedStateEntry = [any, any[] | null];

export interface IHookStore {
  memoizedState: {
    [key: number]: MemoizedStateEntry
  }
}

export interface IEmberHooksComponent extends Component {
  hooks(instance: Component): void,
  instanceProxy: ProxyHandler<any>,
  _state: string,
  _hookStore: IHookStore,
}

let hookCallIndex = 0;
let currentInstance: IEmberHooksComponent | null = null;

const EmberHooksMixin = Mixin.create({
  init(this: IEmberHooksComponent) {
    this._super(...arguments);
    const hooks = this.get('hooks');
    if (hooks) {
      this.set('_hookStore', { memoizedState: {} });
      hookCallIndex = 0;
      currentInstance = this;
      const vals = hooks.call(this);
      this.setProperties(vals);
      currentInstance = null;
    }
  },
  willRender(this: IEmberHooksComponent) {
    this._super(...arguments);
    const hooks = this.get('hooks');
    if (hooks) {
      hookCallIndex = 0;
      currentInstance = this;
      const vals = hooks.call(currentInstance);
      currentInstance.setProperties(vals);
      currentInstance = null;
    }
  },
});

export const useProperties = defaultProps => {
  const self = currentInstance;
  if (self === null) {
    throw new Error('Unable to find Ember instance');
  }

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
  if (self === null) {
    throw new Error('Unable to find Ember instance');
  }

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
export const useMemo = <T>(createMemoizedValue: () => T, deps?: any[] | null): T => {
  const instance = currentInstance;
  if (instance === null) {
    throw new Error('Unable to find Ember instance');
  }

  hookCallIndex++;
  deps = deps != null ? deps : null;

  const hook = instance.get('_hookStore');

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



export default EmberHooksMixin;
