/**
 * @typedef {import('../types').Job}
 * @typedef {import('../helpers/getCurrentTimestamp').getCurrentTimestamp} GetCurrentTimestamp
 */

class Sqlite3Driver {
  #parseJobResult

  #connection

  #getConnection

  #run

  #getRow

  #reserveJob

  /** @type GetCurrentTimestamp */
  #getCurrentTimestamp

  /**
   * @param {Function} promisify
   * @param {GetCurrentTimestamp} getCurrentTimestamp
   * @param {Object} sqlite3
   * @param {string} fileName
   */
  constructor(promisify, getCurrentTimestamp, sqlite3, fileName) {
    this.#getCurrentTimestamp = getCurrentTimestamp;

    /**
     * @param {Object} result
     * @returns {Job|null}
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
     * @returns {Promise<Object>}
     */
    this.#getConnection = () => {
      if (this.#connection) {
        return this.#connection;
      }

      return new Promise((resolve, reject) => {
        this.#connection = new sqlite3.Database(fileName, sqlite3.OPEN_READWRITE, (error) => {
          if (!error) {
            resolve(this.#connection);
          }

          reject(error);
        });
      });
    };

    /**
     * @param {string} query
     * @param {Object} params
     * @returns {Promise<void>}
     */
    this.#run = async (query, params) => {
      await this.#getConnection();
      const run = promisify(this.#connection.run).bind(this.#connection);
      await run(query, params);
    };

    /**
     * @param {string} query
     * @param {Object} params
     * @returns {Promise<Object>}
     */
    this.#getRow = async (query, params) => {
      await this.#getConnection();
      const get = promisify(this.#connection.get).bind(this.#connection);
      return await get(query, params);
    };

    /**
     * @param selectQuery
     * @param params
     * @returns {Promise<Job|null>}
     */
    this.#reserveJob = async (selectQuery, params) => {
      try {
        await this.#run('BEGIN EXCLUSIVE TRANSACTION;');
        const rawJob = await this.#getRow(selectQuery, params);

        if (!rawJob) {
          await this.#run('COMMIT TRANSACTION;');
          return null;
        }

        const job = this.#parseJobResult(rawJob);
        const timestamp = this.#getCurrentTimestamp();
        await this.#run(`UPDATE jobs SET reserved_at = ${timestamp} WHERE uuid = "${job.uuid}"`);
        await this.#run('COMMIT TRANSACTION;');

        return job;
      } catch (error) {
        await this.#run('ROLLBACK TRANSACTION;');
        return null;
      }
    };
  }

  /**
   * @returns {Promise<void>}
   */
  async createJobsDbStructure() {
    const query = 'CREATE TABLE IF NOT EXISTS jobs('
      + 'uuid TEXT PRIMARY KEY,'
      + 'queue TEXT NOT NULL,'
      + 'payload TEXT NOT NULL,'
      + 'created_at INTEGER NOT NULL,'
      + 'reserved_at INTEGER NULL,'
      + 'failed_at INTEGER NULL'
      + ')';

    await this.#run(query);
  }

  /**
   * @param {Job} job
   * @returns {Promise<void>}
   */
  async storeJob(job) {
    const query = 'INSERT INTO jobs(uuid, queue, payload, created_at) VALUES (?, ?, ?, ?)';

    await this.#run(query, [
      job.uuid,
      job.queue,
      JSON.stringify(job.payload),
      job.created_at,
    ]);
  }

  /**
   * @param {string} queue
   * @returns {Promise<Job|null>}
   */
  async getJob(queue) {
    return await this.#reserveJob('SELECT * FROM jobs WHERE queue = ? AND failed_at IS NULL AND reserved_at IS NULL LIMIT 1', [queue]);
  }

  /**
   * @param {string} jobUuid
   * @returns {Promise<Job|null>}
   */
  async getJobByUuid(jobUuid) {
    const query = 'SELECT * FROM jobs WHERE uuid = ? AND reserved_at IS NULL LIMIT 1';

    return await this.#reserveJob(query, [jobUuid]);
  }

  /**
   * @param {string} queue
   * @returns {Promise<Job|null>}
   */
  async getFailedJob(queue) {
    const query = 'SELECT * FROM jobs WHERE queue = ? AND failed_at IS NOT NULL AND reserved_at IS NULL LIMIT 1';

    return await this.#reserveJob(query, [queue]);
  }

  /**
   * @param {string} jobUuid
   * @returns {Promise<void>}
   */
  async deleteJob(jobUuid) {
    await this.#run('DELETE FROM jobs WHERE reserved_at IS NOT NULL AND uuid = ?', [jobUuid]);
  }

  /**
   * @param {string} jobUuid
   * @returns {Promise<void>}
   */
  async markJobAsFailed(jobUuid) {
    const timestamp = this.#getCurrentTimestamp();
    await this.#run('UPDATE jobs SET failed_at = ?, reserved_at = NULL WHERE uuid = ?', [timestamp, jobUuid]);
  }
}

module.exports = Sqlite3Driver;
