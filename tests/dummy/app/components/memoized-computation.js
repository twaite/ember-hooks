import { withHooks, useMemo, useProperties } from "ember-hooks/mixins/ember-hooks";

const MemoizedComponent = withHooks(() => {
  const state = useProperties({
    count: 0,
    countDep: 0
  });

  const increment = () => {
    state.count = state.count+ 1;
  }

  const incrementDep = () => {
    state.countDep = state.countDep + 1;
  }

  // The callback function will only be ran when it's dependencies change
  const expensiveCount = useMemo(() => {
    let x = 0;
    for (let i = 0; i <= state.countDep * 1000000; i++) {
      x++;
    }

    return state.countDep * x;
  }, [state.countDep]);

  return {
    count: state.count,
    countDep: state.countDep,
    expensiveCount,
    actions: {
      increment,
      incrementDep
    },
  };
});

export default MemoizedComponent;
