/**
 * @module types
 */

/**
 * WorkerSettings
 * @typedef module:types.WorkerSettings
 * @type {Object}
 * @property {string} [queue=default] - The queue to work on
 * @property {Number} [restTimeInSeconds=5] -
 * Time to wait after attempting to handle a job whether successful or not
 * @property {Number|null} [limit=null] - Max number of jobs to be handled
 * @property {boolean} [logResults=false] - console.log the return value of the handler function
 * @property {boolean} [logErrors=false] - console.log errors for failed jobs
 * @property {boolean} [stopOnFailure=false] - Stop the worker if a job fails
 * @property {Function} [logger=console.log] - Function used to log. Defaults to console.log
 */
