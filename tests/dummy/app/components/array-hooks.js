import { withHooks, useProperties } from "ember-hooks/mixins/ember-hooks";

const ArrayHooks = withHooks(attrs => {
  const props = useProperties({
    colors: ['red', 'blue', 'orange'],
    count: 0,
  });

  const addColor = () => {
    props.colors.push('test');
  }

  console.log('rerender');

  return {
    actions: {
      addColor,
    },
  };
});

export default ArrayHooks;