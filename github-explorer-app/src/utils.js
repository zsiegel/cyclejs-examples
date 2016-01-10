// helper functions
// source - https://github.com/killercup/cycle-webpack-starter/blob/master/app/helpers/map-errors.js
// These functions are used to help map different objects to the functions responsible for displaying/manipulating them

function isError(data) {
  return !!(data && data.err);
}

function identity(x) {
  return x;
}

// If the incoming object is not an error return the output of the mapper function - otherwise return the object
export function isResult(mapper) {
  return (data) => isError(data) ? identity(data) : mapper(data);
}

// If the incoming object is an error return the output of the mapper function - otherwise return the object
export function isErr(mapper) {
  return (data) => isError(data) ? mapper(data) : identity(data);
}
