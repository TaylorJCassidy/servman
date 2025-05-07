const path = require('path');
const fs = require('fs');
const logger = require('./logger.js')

const log = logger('getJobs')
const files = fs.readdirSync(path.resolve(__dirname, '../jobs'), {withFileTypes: true});
const jobs = new Map();

for (const file of files) {
    if (file.isDirectory()) continue;
    const job = require(`../jobs/${file.name}`);
    if (process.argv.includes(job.name)) jobs.set(job.name, job);
}

log(`Got ${jobs.size} job(s)`);
if (jobs.size == 0) {
    log('Stopping...');
    process.exit();
}

module.exports = jobs;