//  Object.is algorithm
export function is(x: any, y: any): boolean {
  if (x === y) { return  x !== 0 || 1 / x === 1 / y }
  else { return x  !== x && y !== y; }
}

/**
 * Compares a set of dependency arrays to each other. Null values invalidate equality.
 * This is consistent with how deps are checked in other hooks implementations.
 */
export function depsAreEqual(newDeps: any[] | null, prevDeps: any[] | null): boolean {
  if (prevDeps === null || newDeps === null) return false;

  for (let i = 0; i < prevDeps.length && i < newDeps.length; i++) {
    if (!is(newDeps[i], prevDeps[i])) return false;
  }

  return true;
}
