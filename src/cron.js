const cron = require('node-cron')
const config = require('./config.json')
const logger = require('./utils/logger.js')

const log = logger('cron')

module.exports = function startCron(jobs) {
    for(const job of jobs.values()) {
        const jobCron = config[job.name].cron;
        cron.schedule(jobCron, () => {
            log(`Triggered ${job.name} job via cron`);
            job.cron()
        });
        log(`Scheduled ${job.name} job with cron ${jobCron}`);
    }
}
