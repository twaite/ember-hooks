import { useProperties } from 'ember-hooks/mixins/ember-hooks';

export default function useCounter() {
  const state = useProperties({
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