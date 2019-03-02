import { withHooks } from "ember-hooks/mixins/ember-hooks";
import useCounter from "../hooks/useCounter";

const CounterUsingWithHooksComponent = withHooks(() => {
  const { count, increment} = useCounter();

  return {
    count,
    actions: {
      increment,
    },
  };
});

export default CounterUsingWithHooksComponent;
