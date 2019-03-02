/* global clone */
// TODO: figure out how to make clone not global

import Mixin from '@ember/object/mixin';
import Component from '@ember/component';
import { A } from '@ember/array';
import { inject as service } from '@ember/service';

// import { clone } from 'npm:clone';

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
  init(this: IEmberHooksComponent): void {
    this._super(...arguments);
    const hooks = this.get('hooks');
    if (hooks) {
      // TODO: tw - Figure out if we can only set this in the case that useMemo is being used
      this.set('_hookStore', { memoizedState: {} });
      hookCallIndex = 0;
      currentInstance = this;
      const vals = hooks.call(currentInstance);
      currentInstance.setProperties(vals);
      currentInstance = null;
    }
  },
  willRender(this: IEmberHooksComponent): void {
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

/*
 * TODO: tw - doc
 */
export const useObservableProps = (defaultProps: any) => {
  if (currentInstance === null) {
    throw new Error('Unable to find Ember instance');
  }

  const self: IEmberHooksComponent = currentInstance;

  if (self._state === 'preRender' && !self.instanceProxy) {

    // Create a clone of the default props so we can wrap the proxy around a POJO
    // const defaultPropsClone = clone(defaultProps);
    // TODO: tw - this merge busted clone, tried to add ember auto import it's not working, need to debug
    const defaultPropsClone = JSON.parse(JSON.stringify(defaultProps));
    const emberizedDefaultPropsClone = emberizeArrays(defaultPropsClone);

    // TODO: twaite - this should handle arrays as ember arrays

    self.setProperties(emberizedDefaultPropsClone);

    self.instanceProxy = observable(defaultProps, self, []);
  }

  return self.instanceProxy;
};

const emberizeArrays = (obj: any): any => {
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      let value = obj[key];
      if (Array.isArray(value)) {
        value = A(value);
        value = value.map((val: any) => emberizeArrays(val));
      }
      return value;
    })
    return obj;
  }

  return obj;
}

const observable = (obj: any, scope: IEmberHooksComponent, ancestors: string[]): ProxyHandler<any> => {
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
          const navigationString: string = createPropertyNavigationString(obj.__ancestors, prop);
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
    return (val: any) => {
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
    return (...args: any[]) => {
      emberArray.unshiftObjects(args);
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

const createPropertyNavigationString: string = (ancestors: string[], prop: string): string => `${ancestors.join('.')}.${prop}`;

export const useStore = () => {
  if (currentInstance === null) {
    throw new Error('Unable to find Ember instance');
  }
  const self = currentInstance;
  if (self._state === 'preRender') self.set('store', service('store'));
  return self.get('store');
};

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

export const withHooks = (...args: any[]): Component => {
  // This will get any mixins passed in
  const config = args.pop();
  return Component.extend(EmberHooksMixin, ...args, {
    hooks() {
      return config(this.attrs);
    },
  });
};

export default EmberHooksMixin;