import { withHooks } from "ember-hooks/mixins/ember-hooks";
import useCounter from "../hooks/useCounter";

const CounterUsingWithHooksComponent = withHooks(props => {
  console.log(props);
  const { count, increment} = useCounter();

  return {
    count,
    actions: {
      increment,
    },
  };
});

export default CounterUsingWithHooksComponent;