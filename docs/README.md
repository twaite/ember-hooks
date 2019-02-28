# Ember Hooks

The main goal of this project is to bring React/Vue style hooks to ember. This helps reduce the need for mixins by allowing a very declarative way of adding duplicated state (props) in multiple components.

The secondary goal of this project is to introduce a simpler way of writing Ember components. This is done by adding two hooks that allow you to write code in a more familiar way: `useObservedProps` for vue style mutable data and `useState` for react style immutable data. This helps abstract away the overhead of knowing the internals of Ember (get/set for objects, and additional array functionality such as pushObject).

#### Inspired by:
<ul>
  <li><a href="https://reactjs.org/docs/hooks-intro.html">React Hooks</a></li>
  <li><a href="https://github.com/yyx990803/vue-hooks">Vue Hooks</a></li>
</ul>

## Motivation

This project has largely been inspired by my work on a very large and somewhat outdated Ember project. While the functionality offered by this app is incredible, it has gotten very out of date and incredibly confusing for people rolling on and off the project. No where is this more obvious than the liberal use of Mixins. Mixins can be great for a small project with a small team, but when there are many maintainers they often obfuscate the code. Additionally they often get overused where a service or plain JS files could do better.

By offering a better way of reusing state and giving syntax that is similar to Vue or React we will make it much easier for new devs to be productive from day one. Additionally we feel that this method allows a much simpler way to type your reusable code with typescript which will help reduce confusing functionality and testing.

## Caveats

There are two main caveats, the first is unavoidable, because we are wrapping ember components and hooks run on ever rerender there will be some additional overhead for hooks. Additionally observables will keep a copy of your internal state as a plain JS object. We don't expect this to be an issue in most case as we have implemented a couple things to help boost performance. One, setting initial props will only be run once to help reduce overhead, additionally our observables use <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy">Proxies</a> which are much faster than `Object.defineProperty`, for light overhead.

This brings us to the second point, because we use proxies, `useObservedProps` will only work with evergreen browsers. So there is no IE support w/ this hook, if you use the `useState` hook this should not be an issue. However if there was enough demand we could implement observables with `Object.defineProperty` to work with older browsers.

## Basics

Here's the basic usage:

#### Javascript

```javascript
import Component from '@ember/component';
import layout from '../templates/components/counter-with-hooks';
import EmberHooksMixin, { useObservedProps } from 'ember-hooks/mixins/ember-hooks';

export default Component.extend(EmberHooksMixin, {
  layout,
  hooks() {
    // Use properties will automatically bind this data to your components scope
    const state = useObservedProps({
      count: 0,
    });

    // Note that you don't need to refer to this, instead you can mutate the values directly
    const increment = () => {
      state.count = state.count + 1;
    }

    // What gets returned here will bind to your component
    return {
      actions: {
        increment,
      }
    };
  }
});
```

#### Template
```handlebars
<h3>Count: {{count}}</h3>
<button onclick={{action "increment"}}>Increment</button>
```

### Same component using a custom hook:

#### component.js
```javascript
import { withHooks } from "ember-hooks/mixins/ember-hooks";
import useCounter from "../hooks/useCounter";

// withHooks will return a component with the mixin already attached
// You can still pass in additional mixins as arguments before props
const CounterUsingWithHooksComponent = withHooks(props => {

  // Explicitly deconstruct the values you want to use from the hook
  const { count, increment } = useCounter();

  return {
    count,
    actions: {
      increment,
    },
  };
});
```

#### useCounter.js
```javascript
import { useObservedProps } from 'ember-hooks/mixins/ember-hooks';

export default function useCounter() {
  const state = useObservedProps({
    count: 0,
  });

  const increment = () => {
    state.count = state.count + 1;
  }

  return {
    count: state.count,
    increment
  }
}
```

### Typescript

This syntax will also make it much easier to use typescript for static typing:

#### component.ts
```typescript
import { withHooks, useObservedProps } from "ember-hooks/mixins/ember-hooks";
import useCounter from "../hooks/useCounter";

interface CounterAttrs {
  numberAttr: number,
  stringAttr: string,
}

interface ComponentProps {
  myProp: string,
}

interface CounterHookType extends CounterProperties, CounterAttrs {
  actions: {
    customAction: () => void
  }
}

const CounterUsingWithHooksComponent = withHooks((attrs: CounterAttrs): CounterHookType => {
  const { count, increment} = useCounter();

  const props: ComponentProps = useObservedProps({
    myProp: 'prop',
  });

  const customAction = (): void => {
    // Custom action
  }

  return {
    attrs,
    props,
    actions: {
      customAction,
    },
  };
});

export default CounterUsingWithHooksComponent;
```

#### useCount.ts

```typescript
import { useObservedProps } from 'ember-hooks/mixins/ember-hooks';

interface UseCounterProps {
  count: number
}

interface UseCounterType extends UseCounterProps {
  increment: () => void,
}

export default function useCounter(): UseCounterType {
  const state: UseCounterProps = useObservedProps({
    count: 0,
  });

  const increment = () => {
    state.count = state.count + 1;
  }

  return {
    count: state.count,
    increment,
  };
}
```