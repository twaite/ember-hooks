//  Object.is algorithm
export function is(x, y) {
  if (x === y) { return  x !== 0 || 1 / x === 1 / y }
  else { return x  !== x && y !== y; }
}

/**
 * Compares a set of dependency arrays to each other
 */
export function depsAreEqual(newDeps, prevDeps) {
  if (prevDeps === null) return false;

  for (let i = 0; i < prevDeps.length && i < newDeps.length; i++) {
    if (!is(newDeps[i], prevDeps[i])) return false;
  }

  return true;
}
