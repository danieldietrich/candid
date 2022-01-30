/**
 * Calls the given function with the given arguments in the given context.
 * 
 * @param {*} f 
 * @param  {...any} args
 * @returns the result of the function call or undefined if f is not a function
 */
export function call(f, ...args) {
  return (typeof f === 'function') ? f.apply(f, args) : undefined;
}
