import Component from '@ember/component';
import layout from '../templates/components/counter-with-hooks';
import EmberHooksMixin, { useProperties } from 'ember-hooks/mixins/ember-hooks';

export default Component.extend(EmberHooksMixin, {
  layout,
  hooks() {
    const state = useProperties({
      count: 0,
      nested: {
        count: 0,
        nested: {
          count: 0,
        },
      },
    });

    const increment = () => {
      state.count = state.count + 1;
    }

    const incrementNested = () => {
      console.log(state.nested);
      state.nested.count = state.nested.count + 1;
    }

    const incrementUberNested = () => {
      state.nested.nested.count++
    }

    return {
      actions: {
        increment,
        incrementNested,
        incrementUberNested,
      }
    };
  }
});
