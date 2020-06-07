/**
 * Driver
 * @typedef {Object} Driver
 * @property {CreateJobsDbStructure} createJobsDbStructure
 * @property {StoreJob} storeJob
 * @property {GetJob} getJob
 * @property {GetJobByUuid} getJobByUuid
 * @property {GetFailedJob} getFailedJob
 * @property {DeleteJob} deleteJob
 * @property {MarkJobAsFailed} markJobAsFailed
 * @property {DeleteAllJobs} deleteAllJobs
 * @property {CloseConnection} closeConnection
 */

/**
 * Driver - CreateJobsDbStructure
 * @typedef {Function} CreateJobsDbStructure
 * @returns {Promise<void>}
 */

/**
 * Driver - StoreJob
 * @typedef {Function} StoreJob
 * @param {Job} job
 * @returns {Promise<void>}
 */

/**
 * Driver - GetJob
 * @typedef {Function} GetJob
 * @param {string} queue
 * @returns {Promise<Job|null>}
 */

/**
 * Driver - GetJobByUuid
 * @typedef {Function} GetJobByUuid
 * @param {string} jobUuid
 * @returns {Promise<Job|null>}
 */

/**
 * Driver - GetFailedJob
 * @typedef {Function} GetFailedJob
 * @param {string} queue
 * @returns {Promise<Job|null>}
 */

/**
 * Driver - DeleteJob
 * @typedef {Function} DeleteJob
 * @param {string} jobUuid
 * @returns {Promise<void>}
 */

/**
 * Driver - MarkJobAsFailed
 * @typedef {Function} MarkJobAsFailed
 * @param {string} jobUuid
 * @returns {Promise<void>}
 */

/**
 * Driver - deleteAllJobs
 * @typedef {Function} DeleteAllJobs
 * @returns {Promise<void>}
 */

/**
 * Driver - closeConnection
 * @typedef {Function} CloseConnection
 * @returns {Promise<void>}
 */
