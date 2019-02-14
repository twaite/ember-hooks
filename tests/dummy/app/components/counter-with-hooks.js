import Component from '@ember/component';
import layout from '../templates/components/counter-with-hooks';
import EmberHooksMixin, { useProperties } from 'ember-hooks/mixins/ember-hooks';

export default Component.extend(EmberHooksMixin, {
  layout,
  hooks() {
    const state = useProperties({
      count: 0,
      testArray: [1, 2, 3],
    });

    const increment = () => {
      state.count = state.count + 1;
      state.testArray.push(5);
    }

    return {
      actions: {
        increment,
      }
    };
  }
});
