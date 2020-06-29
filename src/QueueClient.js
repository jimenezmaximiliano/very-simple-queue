
/**
 * @class
 */
class QueueClient {
  /** @type {module:types.Driver} */
  #dbDriver

  /** @type {module:types.UuidGenerator} */
  #uuidGenerator

  /** @type {module:helpers.getCurrentTimestamp} */
  #getCurrentTimestamp

  /** @type {Worker} */
  #worker

  #handleJob

  /**
   * @param {module:types.Driver} dbDriver
   * @param {module:types.UuidGenerator} uuidGenerator
   * @param {module:helpers.getCurrentTimestamp} getCurrentTimestamp
   * @param {Object} worker
   */
  constructor(dbDriver, uuidGenerator, getCurrentTimestamp, worker) {
    this.#dbDriver = dbDriver;
    this.#uuidGenerator = uuidGenerator;
    this.#getCurrentTimestamp = getCurrentTimestamp;
    this.#worker = worker;

    /**
     * @param {module:types.Job} job
     * @param {module:types.JobHandler} jobHandler
     * @param {boolean} [throwErrorOnFailure=false] -
     * If a job fails, mark it failed and then throw an error
     * @returns {Promise<null|*>}
     * @throws Error
     */
    this.#handleJob = async (job, jobHandler, throwErrorOnFailure = false) => {
      if (!job) {
        return null;
      }

      try {
        const result = await jobHandler(job.payload);
        await this.#dbDriver.deleteJob(job.uuid);
        return result;
      } catch (error) {
        await this.#dbDriver.markJobAsFailed(job.uuid);

        if (throwErrorOnFailure) {
          throw new Error(`Job with uuid ${job.uuid} failed`);
        }
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
   * @param {module:types.JobHandler} jobHandler
   * @param {string} queue
   * @param {boolean} [throwErrorOnFailure=false] -
   * If a job fails, mark it failed and then throw an error
   * @returns {Promise<*>}
   */
  async handleJob(jobHandler, queue = 'default', throwErrorOnFailure = false) {
    const job = await this.#dbDriver.getJob(queue);

    return this.#handleJob(job, jobHandler, throwErrorOnFailure);
  }

  /**
   * @param {module:types.JobHandler} jobHandler
   * @param {string} jobUuid
   * @param {boolean} [throwErrorOnFailure=false] -
   * If a job fails, mark it failed and then throw an error
   * @returns {Promise<*>}
   */
  async handleJobByUuid(jobHandler, jobUuid, throwErrorOnFailure = false) {
    const job = await this.#dbDriver.getJobByUuid(jobUuid);

    return this.#handleJob(job, jobHandler, throwErrorOnFailure);
  }

  /**
   * @param {module:types.JobHandler} jobHandler
   * @param {string} queue
   * @param {boolean} [throwErrorOnFailure=false] -
   * If a job fails, mark it failed and then throw an error
   * @returns {Promise<*>}
   */
  async handleFailedJob(jobHandler, queue = 'default', throwErrorOnFailure = false) {
    const job = await this.#dbDriver.getFailedJob(queue);

    return this.#handleJob(job, jobHandler, throwErrorOnFailure);
  }

  /**
   * @returns {Promise<void>}
   */
  async closeConnection() {
    await this.#dbDriver.closeConnection();
  }

  /**
   * @param {module:types.JobHandler} jobHandler
   * @param {module:types.WorkerSettings} settings
   * @returns {Promise<void>}
   */
  async work(jobHandler, settings) {
    await this.#worker.work(this, jobHandler, settings);
  }
}

module.exports = QueueClient;
