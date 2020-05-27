/**
 * GetCurrentTimestamp
 * @returns {number}
 */
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

module.exports = getCurrentTimestamp;
