/**
 * @module types
 */

/**
 * WorkerSettings
 * @typedef module:types.WorkerSettings
 * @type {Object}
 * @property {string} queue - The queue to work on
 * @property {Number} restTimeInSeconds - Time to wait after attempting to handle a job whether successful or not
 * @property {Number|null} limit - Max number of jobs to be handled
 * @property {boolean} logResults - console.log the return value of the handler function
 */
