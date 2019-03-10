import { withHooks, useObservedProps } from "ember-hooks/mixins/ember-hooks";

const allColors = ['red', 'blue', 'orange', 'purple', 'green'];

const getRandomColor = () => {
  return allColors[Math.floor(Math.random() * allColors.length)];
}

const ArrayHooks = withHooks(() => {
  const props = useObservedProps({
    colors: ['red'],
  });

  const addColor = () => {
    props.colors.push(getRandomColor());
  }

  const removeColor = () => {
    props.colors.pop();
  }

  const removeFirstColor = () => {
    props.colors.shift();
  }

  const unshiftColor = () => {
    props.colors.unshift(getRandomColor());
  }

  const unshiftMultipleColors = () => {
    props.colors.unshift(getRandomColor(), getRandomColor());
  }

  const reverseColors = () => {
    props.colors.reverse();
  }

  return {
    props,
    actions: {
      addColor,
      removeColor,
      removeFirstColor,
      unshiftColor,
      unshiftMultipleColors,
      reverseColors,
    },
  };
});

export default ArrayHooks;