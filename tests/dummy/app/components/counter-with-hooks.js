import Component from '@ember/component';
import layout from '../templates/components/counter-with-hooks';
import EmberHooksMixin, { useObservedProps } from 'ember-hooks/mixins/ember-hooks';

export default Component.extend(EmberHooksMixin, {
  layout,
  hooks() {
    const state = useObservedProps({
      countA: 0,
      nested: {
        countB: 0,
        nested: {
          countC: 0,
        },
      },
    });

    const increment = () => {
      state.countA = state.countA + 1;
    };

    const incrementNested = () => {
      state.nested.countB = state.nested.countB + 1;
    };

    const incrementUberNested = () => {
      state.nested.nested.countC++
    };

    return {
      actions: {
        increment,
        incrementNested,
        incrementUberNested,
      }
    };
  }
});
