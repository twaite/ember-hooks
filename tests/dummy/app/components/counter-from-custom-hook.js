import Component from '@ember/component';
import layout from '../templates/components/counter-from-custom-hook';
import EmberHooksMixin from 'ember-hooks/mixins/ember-hooks';
import useCounter from '../hooks/useCounter';

export default Component.extend(EmberHooksMixin, {
  layout,
  hooks() {
    const { count, increment } = useCounter();

    return {
      count,
      actions: {
        increment,
      },
    };
  },
});
