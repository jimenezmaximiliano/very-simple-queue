/**
 * @typedef {import('./QueueClient').QueueClient}
 */

const util = require('util');
const sqlite3 = require('sqlite3');
const uuidGenerator = require('uuid').v4;

const getCurrentTimestamp = require('./helpers/getCurrentTimestamp');
const QueueClient = require('./QueueClient');
const Sqlite3Driver = require('./drivers/Sqlite3Driver');

class SimpleJobQueue {

  #supportedDrivers
  /** @type {QueueClient} */
  #queueClient

  constructor(driverConfig) {

    this.#supportedDrivers = ['sqlite3'];

    if (!this.#supportedDrivers.includes(driverConfig.driver)) {
      throw "Driver not supported";
    }

    const drivers = {};

    drivers.sqlite3 = () => {
      const driver = new Sqlite3Driver(util.promisify, getCurrentTimestamp, sqlite3, driverConfig.filePath);
      this.#queueClient = new QueueClient(driver, uuidGenerator, getCurrentTimestamp);
    };

    drivers[driverConfig.driver]();
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
    return await this.#queueClient.pushJob(payload, queue);
  }

  /**
   * @param {JobHandler} jobHandler
   * @param {string} queue
   * @returns {Promise<*>}
   */
  async handleJob(jobHandler, queue = 'default') {
    return await this.#queueClient.handleJob(jobHandler, queue);
  }

  /**
   * @param {JobHandler} jobHandler
   * @param {string} jobUuid
   * @returns {Promise<*>}
   */
  async handleJobByUuid(jobHandler, jobUuid) {
    return await this.#queueClient.handleJobByUuid(jobHandler, jobUuid);
  }

  /**
   * @param {JobHandler} jobHandler
   * @param {string} queue
   * @returns {Promise<*>}
   */
  async handleFailedJob(jobHandler, queue = 'default') {
    return await this.#queueClient.handleFailedJob(jobHandler, queue);
  }
}

module.exports = SimpleJobQueue;
