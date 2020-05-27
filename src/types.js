/**
 * Job
 * @typedef {Object} Job
 * @property {string} uuid
 * @property {string} queue
 * @property {Object} payload
 * @property {number} created_at
 * @property {number|null} reserved_at
 * @property {number|null} failed_at
 */

/**
 * JobHandler
 * @typedef {Function} JobHandler
 * @param {Object} payload
 */

/**
 * UuidGenerator
 * @typedef {Function} UuidGenerator
 * @returns {string}
 */

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
