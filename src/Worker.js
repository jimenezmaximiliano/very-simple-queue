/**
 * @class
 */
class Worker {
  /**
   * @function
   * @param {Number} seconds
   * @returns Promise<void>
   */
  #sleep;

  /** @type {module:types.WorkerSettings} */
  #defaultSettings;

  constructor() {
    this.#sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, (seconds * 1000)));
    this.#defaultSettings = {
      queue: 'default',
      restTimeInSeconds: 5,
      logErrors: true,
      stopOnError: false,
      logResults: false,
      stopOnFailure: false,
      loggerFunction: console.log,
    };
  }

  /**
   * @param {QueueClient} queueClient
   * @param {module:types.JobHandler} jobHandler
   * @param {module:types.WorkerSettings} workerSettings
   * @returns {Promise<void>}
   */
  async work(queueClient, jobHandler, workerSettings) {
    const settings = { ...this.#defaultSettings, ...workerSettings };
    const log = settings.loggerFunction;
    let jobQuantity = 0;
    // eslint-disable-next-line no-constant-condition
    while (!queueClient.shouldShutdown()) {
      jobQuantity += 1;
      try {
        const result = await queueClient.handleJob(jobHandler, settings.queue, true);

        if (settings.logResults) {
          log(`Result: ${JSON.stringify(result)}`);
        }
      } catch (error) {
        if (settings.logErrors) {
          log(JSON.stringify(error.message));
        }

        if (settings.stopOnFailure) {
          return;
        }
      }

      if (queueClient.shouldShutdown()) {
        return;
      }

      if (settings.limit && settings.limit >= jobQuantity) {
        log('Job limit reached');
        return;
      }

      await this.#sleep(settings.restTimeInSeconds);
    }
  }
}

module.exports = Worker;
