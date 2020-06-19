/**
 * @module helpers
 */

/**
 * GetCurrentTimestamp
 * @typedef module:helpers.getCurrentTimestamp
 * @returns {number}
 */
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

module.exports = getCurrentTimestamp;
