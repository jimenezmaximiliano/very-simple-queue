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

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const result = await queueClient.handleJob(jobHandler, settings.queue);

        if (settings.logResults) {
          console.log(`Result: ${JSON.stringify(result)}`);
        }
      } catch (error) {
        if (settings.logErrors) {
          console.log(`Error: ${JSON.stringify(error)}`);
        }

        if (settings.stopOnError) {
          throw error;
        }
      }

      await this.#sleep(settings.restTimeInSeconds);
    }
  }
}

module.exports = Worker;
