import { A } from '@ember/array';
import { IEmberHooksComponent } from 'ember-hooks/mixins/ember-hooks';

export const emberizeArrays = (obj: any): any => {
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

export const observable = (obj: any, scope: IEmberHooksComponent, ancestors?: string[]): ProxyHandler<any> => {
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
      get(target, prop: string) {
        if (target.__isProxy) {
          if (Array.isArray(target)) {
            return _handleArrayFunctions(scope, target, prop);
          }
          return target[prop];
        }

        return scope.get(prop);
      },
      set(obj, prop: string, value) {
        if (obj.__ancestors) {
          const navigationString = _createPropertyNavigationString(obj.__ancestors, prop);
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

const _handleArrayFunctions = (scope: IEmberHooksComponent, target: any, prop: string): Function => {
  // TODO: tw - should this be an object instead of ifs?
  const emberArray = scope.get(target.__ancestors.join());
  if (prop === 'push') {
    return (val: any) => {
      // TODO: tw - create observable here
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

  return target[prop]();
}

const _createPropertyNavigationString = (ancestors: string[], prop: string): string => `${ancestors.join('.')}.${prop}`;