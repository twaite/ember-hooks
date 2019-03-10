import { emberizeArrays, observable, } from './../utils/observedProps';
import Mixin from '@ember/object/mixin';
import Component from '@ember/component';

// TODO: tw - fix this
// import { clone } from 'npm:clone';

import { depsAreEqual } from '../utils/memo';
import Ember from 'ember';

type MemoizedStateEntry = [any, any[] | null];

export interface IHookStore {
  memoizedState: {
    [key: number]: MemoizedStateEntry
  }
}

// @ts-ignore
// tw - unfortunately I need to do this in order to prevent TS from complaining about our set calls
export interface IEmberHooksComponent extends Component {
  hooks(instance: Component): void,
  instanceProxy: ProxyHandler<any>,
  _state: string,
  _hookStore: IHookStore,
  // Have to define this or it will complain about undefined props being set
  set: (prop: string, value: any) => void,
  get: (prop: string) => any,
}

let hookCallIndex = 0;
let currentInstance: IEmberHooksComponent | null = null;

const EmberHooksMixin = Mixin.create({
  init(this: IEmberHooksComponent) {
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

/**
 * useObservedProps is a function that will set ember props on a components
 * scope and wrap them in an observable so that they can be mutated without
 * explicitly calling Ember.get and Ember.set;
 *
 * @param {object} defaultProps - this object defines the default state set on the component
 */
export const useObservedProps = (defaultProps: any) => {
  const self = currentInstance;
  if (self === null) {
    throw new Error('Unable to find Ember instance');
  }

  if (self._state === 'preRender' && !self.instanceProxy) {

    // Create a clone of the default props so we can wrap the proxy around a POJO
    // const defaultPropsClone = clone(defaultProps);
    // TODO: tw - this merge busted clone, tried to add ember auto import it's not working, need to debug
    const defaultPropsClone = JSON.parse(JSON.stringify(defaultProps));
    const emberizedDefaultPropsClone = emberizeArrays(defaultPropsClone);

    // TODO: twaite - this should handle arrays as ember arrays

    self.setProperties(emberizedDefaultPropsClone);

    self.instanceProxy = observable(defaultProps, self);
  }

  return self.instanceProxy;
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

export const withHooks = (...args: Ember.Object[]) => {
  // This will get any mixins passed in
  const config: any = args.pop();
  // @ts-ignore
  // Ignoring b/c the component doesn't like having multiple mixins
  return Component.extend(EmberHooksMixin, ...args, {
    hooks() {
      return config(this.attrs);
    },
  });
};

export default EmberHooksMixin;