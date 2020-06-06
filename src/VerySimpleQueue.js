/**
 * @typedef {import('./QueueClient').QueueClient}
 */
const util = require('util');
const sqlite3 = require('sqlite3');
const uuidGenerator = require('uuid').v4;
const redis = require('redis');
const RedLock = require('redlock');

const getCurrentTimestamp = require('./helpers/getCurrentTimestamp');
const QueueClient = require('./QueueClient');
const Sqlite3Driver = require('./drivers/Sqlite3Driver');
const RedisDriver = require('./drivers/RedisDriver');

/**
 * @class
 */
class VerySimpleQueue {
  #supportedDrivers

  /** @type {QueueClient} */
  #queueClient

  /**
   * @param {string} driverName
   * @param {Sqlite3DriverConfig | Object} driverConfig
   */
  constructor(driverName, driverConfig) {
    this.#supportedDrivers = ['sqlite3', 'redis'];

    if (!this.#supportedDrivers.includes(driverName)) {
      throw new Error('Driver not supported');
    }

    const drivers = {};

    drivers.sqlite3 = () => {
      if (driverConfig.filePath === ':memory:') {
        throw new Error(':memory: is not supported');
      }

      const driver = new Sqlite3Driver(
        util.promisify,
        getCurrentTimestamp,
        sqlite3,
        driverConfig,
      );
      this.#queueClient = new QueueClient(driver, uuidGenerator, getCurrentTimestamp);
    };

    drivers.redis = () => {
      const driver = new RedisDriver(
        util.promisify,
        getCurrentTimestamp,
        redis,
        driverConfig,
        RedLock,
      );

      this.#queueClient = new QueueClient(driver, uuidGenerator, getCurrentTimestamp);
    };

    drivers[driverName]();
  }

  /**
   * @returns {Promise<void>}
   */
  async createJobsDbStructure() {
    await this.#queueClient.createJobsDbStructure();
  }

  /**
   * @param {Object} payload
   * @param {string|null} queue
   * @returns {Promise<string>} - Created job uuid
   */
  async pushJob(payload, queue = 'default') {
    return this.#queueClient.pushJob(payload, queue);
  }

  /**
   * @param {JobHandler} jobHandler
   * @param {string} queue
   * @returns {Promise<*>}
   */
  async handleJob(jobHandler, queue = 'default') {
    return this.#queueClient.handleJob(jobHandler, queue);
  }

  /**
   * @param {JobHandler} jobHandler
   * @param {string} jobUuid
   * @returns {Promise<*>}
   */
  async handleJobByUuid(jobHandler, jobUuid) {
    return this.#queueClient.handleJobByUuid(jobHandler, jobUuid);
  }

  /**
   * @param {JobHandler} jobHandler
   * @param {string} queue
   * @returns {Promise<*>}
   */
  async handleFailedJob(jobHandler, queue = 'default') {
    return this.#queueClient.handleFailedJob(jobHandler, queue);
  }

  /**
   * @returns {Promise<void>}
   */
  async closeConnection() {
    await this.#queueClient.closeConnection();
  }
}

module.exports = VerySimpleQueue;
