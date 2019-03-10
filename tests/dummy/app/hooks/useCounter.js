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
