import { withHooks, useProperties } from "ember-hooks/mixins/ember-hooks";

const allColors = ['red', 'blue', 'orange', 'purple', 'green'];

const ArrayHooks = withHooks(() => {
  const props = useProperties({
    colors: ['red'],
  });

  const addColor = () => {
    const randomColor = allColors[Math.floor(Math.random() * allColors.length)];
    props.colors.push(randomColor);
  }

  const removeColor = () => {
    props.colors.pop();
  }

  return {
    props,
    actions: {
      addColor,
      removeColor,
    },
  };
});

export default ArrayHooks;