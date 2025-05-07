const startCron = require('./cron.js');
const startServer = require('./server.js');
const jobs = require('./utils/getJobs.js')

startCron(jobs);
startServer(jobs);