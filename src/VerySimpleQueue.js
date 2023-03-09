const util = require('util');
const sqlite3 = require('sqlite3');
const uuidGenerator = require('uuid').v4;
const redis = require('redis');
const RedLock = require('redlock');
const mysql = require('mysql2/promise');

const getCurrentTimestamp = require('./helpers/getCurrentTimestamp');
const QueueClient = require('./QueueClient');
const Sqlite3Driver = require('./drivers/Sqlite3Driver');
const MysqlDriver = require('./drivers/MysqlDriver');
const RedisDriver = require('./drivers/RedisDriver');
const Worker = require('./Worker');

/**
 * @class
 */
class VerySimpleQueue {
  /** @type {string[]} */
  #supportedDrivers

  /** @type {QueueClient} */
  #queueClient

  /**
   * VerySimpleQueue client constructor
   * @param {string} driverName - 'sqlite3' or 'redis'
   * @param {module:types.Sqlite3DriverConfig | Object} driverConfig -
   * Driver specific configuration. For redis see https://github.com/NodeRedis/node-redis#options-object-properties . For mysql see https://github.com/mysqljs/mysql#connection-options .
   *
   * @example <caption>Sqlite3 driver</caption>
   * new VerySimpleQueue('sqlite3', { filePath: '/tmp/db.sqlite3' });
   * @example <caption>Redis driver</caption>
   * new VerySimpleQueue('redis', {}); // Options: https://github.com/NodeRedis/node-redis#options-object-properties
   * @example <caption>MySQL driver</caption>
   * new VerySimpleQueue('mysql', {
   *      host: 'localhost',
   *      user: 'root',
   *      password: 'root',
   *      database: 'queue',
   *    }); // Options: https://github.com/mysqljs/mysql#connection-options
   */
  constructor(driverName, driverConfig) {
    this.#supportedDrivers = ['sqlite3', 'redis', 'mysql'];

    if (!this.#supportedDrivers.includes(driverName)) {
      throw new Error(`Driver not supported: ${driverName}`);
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
      this.#queueClient = new QueueClient(driver, uuidGenerator, getCurrentTimestamp, new Worker());
    };

    drivers.redis = () => {
      const driver = new RedisDriver(
        getCurrentTimestamp,
        redis,
        driverConfig,
        RedLock,
      );

      this.#queueClient = new QueueClient(driver, uuidGenerator, getCurrentTimestamp, new Worker());
    };

    drivers.mysql = () => {
      const driver = new MysqlDriver(
        getCurrentTimestamp,
        mysql,
        driverConfig,
      );

      this.#queueClient = new QueueClient(driver, uuidGenerator, getCurrentTimestamp, new Worker());
    };

    drivers[driverName]();
  }

  /**
   * Creates the jobs table for SQL drivers and does nothing for redis
   *
   * @returns {Promise<void>}
   */
  async createJobsDbStructure() {
    await this.#queueClient.createJobsDbStructure();
  }

  /**
   * Push a new job to a queue
   *
   * @param {Object} payload - This the object that the handler is going to get
   * when you try to handle the job
   * @param {string} [queue=default] - Queue name
   * @returns {Promise<string>} - A promise of the created job's uuid
   *
   * @example
   * const jobUuid = verySimpleQueue.pushJob({ sendEmailTo: 'foo@foo.com' }, 'emails-to-send');
   */
  async pushJob(payload, queue = 'default') {
    return this.#queueClient.pushJob(payload, queue);
  }

  /**
   * Handle one job in the given queue.
   * The job gets deleted if it doesn't fail, and is marked as failed if it does.
   *
   * @param {module:types.JobHandler} jobHandler - Function that will receive the payload
   * and handle the job
   * @param {string} [queue=default] - The queue from which to take the job
   * @param {boolean} [throwErrorOnFailure=false] -
   * If a job fails, mark it failed and then throw an error
   * @returns {Promise<*>} - A promise of what the jobHandler returns
   *
   * @example
   * verySimpleQueue.handleJob((payload) => sendEmail(payload.email), 'emails-to-send');
   */
  async handleJob(jobHandler, queue = 'default', throwErrorOnFailure = false) {
    return this.#queueClient.handleJob(jobHandler, queue, throwErrorOnFailure);
  }

  /**
   * Handle a job by uuid
   * Same as handleJob but here you know which job you want to handle
   *
   * @param {module:types.JobHandler} jobHandler - Function that will receive the payload
   * and handle the job
   * @param {string} jobUuid - The job uuid that you've got when you pushed the job
   * @param {boolean} [throwErrorOnFailure=false] -
   * If a job fails, mark it failed and then throw an error
   * @returns {Promise<*>} - A promise of what the jobHandler returns
   *
   * @example
   * verySimpleQueue.handleJobByUuid(
   *  (payload) => sendEmail(payload.email),
   *  'd5dfb2d6-b845-4e04-b669-7913bfcb2600'
   * );
   */
  async handleJobByUuid(jobHandler, jobUuid, throwErrorOnFailure = false) {
    return this.#queueClient.handleJobByUuid(jobHandler, jobUuid, throwErrorOnFailure);
  }

  /**
   * Handle a job that failed on a given queue
   *
   * @param {module:types.JobHandler} jobHandler - Function that will receive the payload
   * and handle the job
   * @param {string} [queue=default] - The queue from which to take the failed job
   * @param {boolean} [throwErrorOnFailure=false] -
   * If a job fails, mark it failed and then throw an error
   * @returns {Promise<*>} - A promise of what the jobHandler returns
   *
   * @example
   * verySimpleQueue.handleFailedJob((payload) => tryAgain(payload.email), 'emails-to-send');
   */
  async handleFailedJob(jobHandler, queue = 'default', throwErrorOnFailure = false) {
    return this.#queueClient.handleFailedJob(jobHandler, queue, throwErrorOnFailure);
  }

  /**
   * Closes the connection to the database
   *
   * @returns {Promise<void>}
   */
  async closeConnection() {
    await this.#queueClient.closeConnection();
  }

  /**
   * Worker function to continuously handle jobs on a queue
   *
   * @param {module:types.JobHandler} jobHandler
   * @param {module:types.WorkerSettings} settings
   * @returns {Promise<void>}
   *
   * @example
   * verySimpleQueue.work(
   *  (payload) => sendEmail(payload.email),
   *  { queue: 'email-to-send' }
   * );
   */
  async work(jobHandler, settings) {
    await this.#queueClient.work(jobHandler, settings);
  }
}

module.exports = VerySimpleQueue;
