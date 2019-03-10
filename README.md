Ember Hooks
==============================================================================

This is an experimental addon that allows you to use react style hooks inside of ember. In theory this should allow you to create your Ember components without ever using the `this` keyword. Additionally I have wrapped the ember props in a proxy that handles getting and setting for you. This should allow you to just set and get like you would with normal objects. This is still WIP and experimental.


### Javascript with default hooks:
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

### Template
```handlebars
<h3>Count: {{count}}</h3>
<button onclick={{action "increment"}}>Increment</button>
```

### Same component using a custom hook:
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

export default CounterUsingWithHooksComponent;
```

Installation
------------------------------------------------------------------------------

```
ember install ember-hooks
```


Usage
------------------------------------------------------------------------------

[Longer description of how to use the addon in apps.]


Contributing
------------------------------------------------------------------------------

### Installation

* `git clone https://github.com/twaite/ember-hooks`
* `cd ember-hooks`
* `yarn`

### Linting

* `yarn lint:hbs`
* `yarn lint:js`
* `yarn lint:js -- --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `ember try:each` – Runs the test suite against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
