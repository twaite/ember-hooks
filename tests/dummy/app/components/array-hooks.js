import { withHooks, useProperties } from "ember-hooks/mixins/ember-hooks";

const ArrayHooks = withHooks(attrs => {
  const props = useProperties({
    count: 0,
    // nested: {
    //   count: 0,
    // },
  });

  const increment = () => {
    props.count++;
  }

  const incrementNested = () => {
    props.nested.count++;
  }

  return {
    props,
    actions: {
      increment,
      incrementNested,
    },
  };
});

export default ArrayHooks;