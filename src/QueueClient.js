
/**
 * @typedef {import('./types').Job}
 * @typedef {import('./types').JobHandler}
 * @typedef {import('./types').Driver}
 * @typedef {import('./types').UuidGenerator}
 * @typedef {import('./helpers/getCurrentTimestamp').getCurrentTimestamp } GetCurrentTimestamp
 */

class QueueClient {
  /** @type {Driver} */
  #dbDriver

  /** @type {UuidGenerator} */
  #uuidGenerator

  /** @type {GetCurrentTimestamp} */
  #getCurrentTimestamp

  #handleJob

  /**
   * @param {Driver} dbDriver
   * @param {UuidGenerator} uuidGenerator
   * @param {GetCurrentTimestamp} getCurrentTimestamp
   */
  constructor(dbDriver, uuidGenerator, getCurrentTimestamp) {
    this.#dbDriver = dbDriver;
    this.#uuidGenerator = uuidGenerator;
    this.#getCurrentTimestamp = getCurrentTimestamp;

    /**
     * @param {Job} job
     * @param {JobHandler} jobHandler
     * @returns {Promise<null|*>}
     */
    this.#handleJob = async (job, jobHandler) => {
      if (!job) {
        return null;
      }

      try {
        const result = await jobHandler(job.payload);
        await this.#dbDriver.deleteJob(job.uuid);
        return result;
      } catch (error) {
        await this.#dbDriver.markJobAsFailed(job.uuid);
      }

      return null;
    };
  }

  /**
   * @returns {Promise<void>}
   */
  async createJobsDbStructure() {
    await this.#dbDriver.createJobsDbStructure();
  }

  /**
   * @param {Object} payload
   * @param {string|null} queue
   * @returns {Promise<string>} - Created job uuid
   */
  async pushJob(payload, queue = 'default') {
    const job = {
      uuid: this.#uuidGenerator(),
      queue,
      payload,
      created_at: this.#getCurrentTimestamp(),
      reserved_at: null,
      failed_at: null,
    };

    await this.#dbDriver.storeJob(job);

    return job.uuid;
  }

  /**
   * @param {JobHandler} jobHandler
   * @param {string} queue
   * @returns {Promise<*>}
   */
  async handleJob(jobHandler, queue = 'default') {
    const job = await this.#dbDriver.getJob(queue);

    return this.#handleJob(job, jobHandler);
  }

  /**
   * @param {JobHandler} jobHandler
   * @param {string} jobUuid
   * @returns {Promise<*>}
   */
  async handleJobByUuid(jobHandler, jobUuid) {
    const job = await this.#dbDriver.getJobByUuid(jobUuid);

    return this.#handleJob(job, jobHandler);
  }

  /**
   * @param {JobHandler} jobHandler
   * @param {string} queue
   * @returns {Promise<*>}
   */
  async handleFailedJob(jobHandler, queue = 'default') {
    const job = await this.#dbDriver.getFailedJob(queue);

    return this.#handleJob(job, jobHandler);
  }
}

module.exports = QueueClient;
