/**
 * @class
 * @implements Driver
 */
class RedisDriver {
  #parseJobResult;

  #connection;

  #reserveJob;

  #setConnection;

  #getJobByKey;

  #getJobByPattern;

  #getJobKeyByPattern;

  #markJob;

  #failJob;

  /** @type getCurrentTimestamp */
  #getCurrentTimestamp;

  /**
   * @param {module:helpers.getCurrentTimestamp} getCurrentTimestamp
   * @param {Object} redis
   * @param {Object} redisConfig
   * @param {Function} Redlock
   */
  constructor(getCurrentTimestamp, redis, redisConfig, Redlock) {
    this.#getCurrentTimestamp = getCurrentTimestamp;

    /**
     * @return {void}
     */
    this.#setConnection = async () => {
      if (this.#connection && this.#connection.isOpen) {
        await this.#connection.ping();
        return;
      }

      const config = { legacyMode: true, ...redisConfig };
      const client = redis.createClient(config);
      await client.connect();
      await client.ping();

      client.on("error", (err) => {
        // eslint-disable-next-line no-console
        console.log('redis client error event', err)
      })

      this.#connection = client;
    };

    /**
     * @param {Object} result
     * @returns {module:types.Job|null}
     */
    this.#parseJobResult = (result) => {
      if (!result) {
        return null;
      }

      const job = result;
      job.payload = JSON.parse(job.payload);

      return job;
    };

    /**
     * @param {module:types.Job} job
     * @param {string} mark
     * @param {string} currentState
     * @returns {Promise<void>}
     */
    this.#markJob = async (job, mark, currentState) => {
      await this.#setConnection()
      const redlock = new Redlock([this.#connection], {
        retryCount: 1,
      });

      let resourceLock;

      try {
        resourceLock = await redlock.lock(`jobs:locks:${job.queue}/${job.uuid}`, 10000000);
      } catch (lockingError) {
        throw new Error('Failed to get a lock');
      }

      try {
        const set = this.#connection.v4.set.bind(this.#connection);
        const del = this.#connection.v4.del.bind(this.#connection);
        const keyToDelete = await this.#getJobKeyByPattern(`jobs_${currentState}:*${job.uuid}`);
        await del(keyToDelete);
        await set(`jobs_${mark}:${job.queue}/${job.uuid}`, JSON.stringify(job));
      } catch (error) {
        await resourceLock.unlock();
        throw new Error('Failed to reserve job');
      }

      await resourceLock.unlock();
    };

    /**
     * @param {module:types.Job} job
     * @returns {Promise<module:types.Job|null>}
     */
    this.#reserveJob = async (job) => {
      const jobCopy = { ...job };
      const currentState = jobCopy.failed_at ? 'failed' : 'available';
      jobCopy.reserved_at = this.#getCurrentTimestamp();
      jobCopy.failed_at = null;

      try {
        await this.#markJob(jobCopy, 'reserved', currentState);
      } catch (error) {
        return null;
      }

      return jobCopy;
    };

    /**
     * @param {module:types.Job} job
     * @returns {Promise<void>}
     */
    this.#failJob = async (job) => {
      const jobCopy = { ...job };
      jobCopy.failed_at = this.#getCurrentTimestamp();
      jobCopy.reserved_at = null;
      await this.#markJob(jobCopy, 'failed', 'reserved');
    };

    /**
     * @param {string} key
     * @returns {Promise<null|any>}
     */
    this.#getJobByKey = async (key) => {
      const get = this.#connection.v4.get.bind(this.#connection);

      const rawJob = await get(key);

      if (!rawJob) {
        return null;
      }

      return JSON.parse(rawJob);
    };

    /**
     * @param {string} pattern
     * @returns {Promise<null|module:types.Job>}
     */
    this.#getJobByPattern = async (pattern) => {
      const key = await this.#getJobKeyByPattern(pattern);

      if (!key) {
        return null;
      }

      return this.#getJobByKey(key);
    };

    /**
     * @param {string} pattern
     * @returns {Promise<string|null>}
     */
    this.#getJobKeyByPattern = async (pattern) => {
      const keys = this.#connection.v4.keys.bind(this.#connection);
      const keysResult = await keys(pattern)

      if (Array.isArray(keysResult) && keysResult.length > 0) {
        return keysResult[0]
      }

      return null;
    };
  }

  /**
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-empty-function
  async createJobsDbStructure() {
  }

  /**
   * @param {{name: string}} job
   * @returns {Promise<void>}
   */
  async storeJob(job) {
    await this.#setConnection();
    const set = this.#connection.v4.set.bind(this.#connection)
    await set(`jobs_available:${job.queue}/${job.uuid}`, JSON.stringify(job), {"NX": true});
  }

  /**
   * @param {string} queue
   * @returns {Promise<module:types.Job|null>}
   */
  async getJob(queue) {
    await this.#setConnection();
    const job = await this.#getJobByPattern(`jobs_available:${queue}/*`);

    if (!job) {
      return null;
    }

    try {
      return this.#reserveJob(job);
    } catch (error) {
      return null;
    }
  }

  /**
   * @param {string} jobUuid
   * @returns {Promise<module:types.Job|null>}
   */
  async getJobByUuid(jobUuid) {
    await this.#setConnection();
    const job = await this.#getJobByPattern(`jobs_available:*/${jobUuid}`);
    try {
      return this.#reserveJob(job);
    } catch (error) {
      return null;
    }
  }

  /**
   * @param {string} queue
   * @returns {Promise<module:types.Job|null>}
   */
  async getFailedJob(queue) {
    const job = await this.#getJobByPattern(`jobs_failed:${queue}/*`);

    try {
      return this.#reserveJob(job);
    } catch (error) {
      return null;
    }
  }

  /**
   * @param {string} jobUuid
   * @returns {Promise<void>}
   */
  async deleteJob(jobUuid) {
    const jobKey = await this.#getJobKeyByPattern(`jobs_*${jobUuid}`);
    const del = this.#connection.v4.del.bind(this.#connection);

    await del(jobKey);
  }

  /**
   * @param {string} jobUuid
   * @returns {Promise<void>}
   */
  async markJobAsFailed(jobUuid) {
    const job = await this.#getJobByPattern(`jobs_reserved:*${jobUuid}`);
    await this.#failJob(job);
  }

  /**
   * @returns {Promise<void>}
   */
  async deleteAllJobs() {
    await this.#setConnection();
    const keys = this.#connection.v4.keys.bind(this.#connection);
    const allKeys = await keys('*');
    const del = this.#connection.v4.del.bind(this.#connection);

    if (!allKeys) {
      return;
    }

    const delPromises = allKeys.map((key) => del(key));

    await Promise.all(delPromises);
  }

  /**
   * @returns {Promise<void>}
   */
  async closeConnection() {
    const quit = this.#connection.v4.quit.bind(this.#connection);
    await quit();
  }
}

module.exports = RedisDriver;
